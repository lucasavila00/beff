use crate::diag::{Diagnostic, DiagnosticMessage};
use crate::open_api_ast::{
    Definition, JsonSchema, OpenApi, OperationObject, ParameterIn, ParameterObject,
};
use crate::type_to_schema::TypeToSchema;
use crate::{open_api_ast, ParsedModule};
use anyhow::Result;
use core::{fmt, panic};
use jsdoc::ast::{SummaryTag, Tag, UnknownTag, VersionTag};
use jsdoc::Input;
use swc_common::comments::{Comment, CommentKind, Comments};
use swc_common::{collections::AHashMap, FileName};
use swc_common::{BytePos, Span};
use swc_ecma_ast::{
    ArrayPat, ArrowExpr, AssignPat, BindingIdent, ComputedPropName, ExportDefaultExpr, Expr,
    FnExpr, Function, Ident, Invalid, KeyValueProp, ObjectPat, Pat, Prop, PropName, PropOrSpread,
    RestPat, TaggedTpl, TsEntityName, TsTupleType, TsType, TsTypeParamDecl,
    TsTypeParamInstantiation, TsTypeRef,
};
use swc_ecma_visit::Visit;

fn extract_promise(typ: &TsType) -> &TsType {
    if let TsType::TsTypeRef(refs) = typ {
        if let TsEntityName::Ident(i) = &refs.type_name {
            // if name is promise
            if i.sym == *"Promise" {
                let ts_type = refs
                    .type_params
                    .as_ref()
                    .unwrap()
                    .params
                    .get(0)
                    .unwrap()
                    .as_ref();
                return ts_type;
            }
        }
    }
    panic!("not supported")
}

#[derive(Debug, Clone)]
pub enum HeaderOrCookie {
    Header,
    Cookie,
}
impl fmt::Display for HeaderOrCookie {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            HeaderOrCookie::Header => write!(f, "header"),
            HeaderOrCookie::Cookie => write!(f, "cookie"),
        }
    }
}

#[derive(Debug, Clone)]
pub enum HandlerParameter {
    PathOrQuery {
        schema: JsonSchema,
        required: bool,
        description: Option<String>,
        span: Span,
    },
    HeaderOrCookie {
        kind: HeaderOrCookie,
        schema: JsonSchema,
        required: bool,
        description: Option<String>,
        span: Span,
    },
    Context,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum MethodKind {
    Get,
    Post,
    Use,
}
impl fmt::Display for MethodKind {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            MethodKind::Get => write!(f, "get"),
            MethodKind::Post => write!(f, "post"),
            MethodKind::Use => write!(f, "use"),
        }
    }
}

#[derive(Debug, Clone)]
pub struct FnHandler {
    pub method_kind: MethodKind,
    pub pattern: String,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub parameters: Vec<(String, HandlerParameter)>,
    pub return_type: JsonSchema,
}

pub struct ExtractExportDefaultVisitor<'a> {
    files: &'a AHashMap<FileName, ParsedModule>,
    current_file: &'a ParsedModule,
    handlers: Vec<FnHandler>,
    components: Vec<Definition>,
    found_default_export: bool,
    errors: Vec<Diagnostic>,
    info: open_api_ast::Info,
}
impl<'a> ExtractExportDefaultVisitor<'a> {
    fn new(
        files: &'a AHashMap<FileName, ParsedModule>,
        current_file: &'a ParsedModule,
    ) -> ExtractExportDefaultVisitor<'a> {
        ExtractExportDefaultVisitor {
            files,
            current_file,
            handlers: vec![],
            components: vec![],
            found_default_export: false,
            errors: vec![],
            info: open_api_ast::Info {
                title: None,
                description: None,
                version: None,
            },
        }
    }
}

fn trim_description_comments(it: String) -> String {
    // remove all spaces and * from end of string
    let mut v: Vec<char> = it.chars().collect();

    if v.is_empty() {
        return it;
    }

    while v.last().unwrap().is_ascii_whitespace() || v.last().unwrap() == &'*' {
        v.pop();
    }

    v.into_iter().collect()
}

struct EndpointComments {
    pub summary: Option<String>,
    pub description: Option<String>,
}
#[allow(clippy::to_string_in_format_args)]
fn parse_endpoint_comments(acc: &mut EndpointComments, comments: Vec<Comment>) {
    for c in comments {
        if c.kind == CommentKind::Block {
            let s = c.text;
            let parsed = jsdoc::parse(Input::new(BytePos(0), BytePos(s.as_bytes().len() as _), &s));
            match parsed {
                Ok((rest, parsed)) => {
                    acc.description = Some(trim_description_comments(
                        parsed.description.value.to_string(),
                    ));
                    if rest.len() > 0 {
                        acc.description = Some(format!(
                            "{}\n{}",
                            acc.description.as_ref().unwrap_or(&String::new()),
                            rest.to_string()
                        ));
                    }
                    for tag in parsed.tags {
                        match tag.tag {
                            Tag::Summary(SummaryTag { text, .. }) => {
                                acc.summary = Some(text.value.to_string());
                            }
                            _ => panic!("Unknown tag {tag:?}"),
                        }
                    }
                }
                Err(_) => panic!("cannot parse jsdocs"),
            }
        }
    }
}
fn parse_description_comment(comments: Vec<Comment>) -> Option<String> {
    assert!(comments.len() == 1);
    let first = comments.into_iter().next().unwrap();
    if first.kind == CommentKind::Block {
        let s = first.text;
        let parsed = jsdoc::parse(Input::new(BytePos(0), BytePos(s.as_bytes().len() as _), &s));
        match parsed {
            Ok((rest, parsed)) => {
                assert!(rest.is_empty());
                assert!(parsed.tags.is_empty());
                return Some(trim_description_comments(
                    parsed.description.value.to_string(),
                ));
            }
            Err(_) => panic!("cannot parse jsdocs"),
        }
    }
    None
}

impl<'a> ExtractExportDefaultVisitor<'a> {
    fn parse_key(key: &PropName) -> (MethodKind, String, Span) {
        match key {
            PropName::Computed(ComputedPropName { expr, .. }) => match &**expr {
                Expr::TaggedTpl(TaggedTpl {
                    tag,
                    type_params,
                    tpl,
                    span,
                    ..
                }) => {
                    assert!(type_params.is_none());
                    let tag = tag.as_ident().unwrap();
                    let kind = match tag.sym.to_string().as_str() {
                        "GET" => MethodKind::Get,
                        "POST" => MethodKind::Post,
                        "USE" => MethodKind::Use,
                        _ => panic!("unrecognized method"),
                    };
                    assert!(tpl.exprs.is_empty());
                    assert!(tpl.quasis.len() == 1);
                    let first_quasis = tpl.quasis[0].raw.to_string();
                    (kind, first_quasis, *span)
                }
                _ => panic!("not TaggedTpl"),
            },
            _ => panic!("not computed key"),
        }
    }

    fn extend_components(&mut self, defs: Vec<Definition>) {
        for d in defs {
            let found = self.components.iter_mut().find(|x| x.name == d.name);
            if let Some(found) = found {
                assert!(found.schema == d.schema);
            } else {
                self.components.push(d);
            }
        }
    }

    fn convert_to_json_schema(&mut self, ty: &TsType) -> JsonSchema {
        let mut to_schema = TypeToSchema::new(self.files, self.current_file);
        let res = to_schema.convert_ts_type(ty);

        let mut kvs = vec![];
        for (k, v) in to_schema.components {
            match v {
                Some(s) => kvs.push((k, s)),
                None => panic!("should exist"),
            }
        }
        kvs.sort_by(|(ka, _), (kb, _)| ka.cmp(kb));
        let ext = kvs.into_iter().map(|(_k, v)| v).collect();
        self.extend_components(ext);
        self.errors.extend(to_schema.errors);
        res
    }
    fn parse_lib_param(
        &mut self,
        lib_ty_name: &Ident,
        params: &Option<Box<TsTypeParamInstantiation>>,
        required: bool,
        description: Option<String>,
    ) -> HandlerParameter {
        let name = lib_ty_name.sym.to_string();
        let name = name.as_str();
        match name {
            "Header" | "Cookie" => {
                let params = &params.as_ref().unwrap().params;
                assert!(params.len() == 1);
                let ty = params[0].as_ref();
                HandlerParameter::HeaderOrCookie {
                    kind: if name == "Header" {
                        HeaderOrCookie::Header
                    } else {
                        HeaderOrCookie::Cookie
                    },
                    schema: self.convert_to_json_schema(ty),
                    required,
                    description,
                    span: lib_ty_name.span,
                }
            }
            _ => panic!("not in lib: {}", name),
        }
    }

    fn parse_type_ref_parameter(
        &mut self,
        tref: &TsTypeRef,
        ty: &TsType,
        required: bool,
        description: Option<String>,
    ) -> HandlerParameter {
        if let TsEntityName::Ident(i) = &tref.type_name {
            let bff_import = self
                .current_file
                .imports
                .get(&(i.sym.clone(), i.span.ctxt))
                .and_then(|it| if it.is_bff { Some(it) } else { None });
            if bff_import.is_some() {
                return self.parse_lib_param(i, &tref.type_params, required, description);
            }
            if i.sym.to_string() == "Context" {
                return HandlerParameter::Context;
            }
        }
        HandlerParameter::PathOrQuery {
            schema: self.convert_to_json_schema(ty),
            required,
            description,
            span: tref.span,
        }
    }
    fn parse_parameter_type(
        &mut self,
        ty: &TsType,
        required: bool,
        description: Option<String>,
        span: &Span,
    ) -> HandlerParameter {
        match ty {
            TsType::TsTypeRef(tref) => {
                self.parse_type_ref_parameter(tref, ty, required, description)
            }
            _ => HandlerParameter::PathOrQuery {
                schema: self.convert_to_json_schema(ty),
                required,
                description,
                span: *span,
            },
        }
    }

    fn error_param(
        &mut self,
        span: &Span,
        msg: DiagnosticMessage,
    ) -> Vec<(String, HandlerParameter)> {
        let err = Diagnostic {
            message: msg,
            file_name: self.current_file.module.fm.name.clone(),
            span: *span,
        };
        self.errors.push(err);
        vec![]
    }
    fn parse_arrow_param_from_type_expecting_tuple(
        &mut self,
        it: &TsType,
        rest_span: &Span,
    ) -> Vec<(String, HandlerParameter)> {
        match it {
            TsType::TsTypeRef(TsTypeRef {
                type_name,
                type_params,
                ..
            }) => {
                if type_params.is_some() {
                    return self
                        .error_param(rest_span, DiagnosticMessage::TsTypeParametersNotSupported);
                }
                match &type_name {
                    TsEntityName::TsQualifiedName(_) => {
                        self.error_param(rest_span, DiagnosticMessage::TsQualifiedNameNotSupported)
                    }
                    TsEntityName::Ident(i) => {
                        let alias_opt = self
                            .current_file
                            .locals
                            .type_aliases
                            .get(&(i.sym.clone(), i.span.ctxt))
                            .map(|alias| {
                                self.parse_arrow_param_from_type_expecting_tuple(alias, rest_span)
                            });

                        alias_opt.unwrap()
                    }
                }
            }
            TsType::TsTupleType(TsTupleType { elem_types, .. }) => elem_types
                .iter()
                .flat_map(|it| match &it.label {
                    Some(pat) => match pat {
                        Pat::Ident(BindingIdent { id, .. }) => {
                            let comments = self.current_file.comments.get_leading(id.span.lo);
                            let description = comments.and_then(parse_description_comment);
                            let param = self.parse_parameter_type(
                                &it.ty,
                                !id.optional,
                                description,
                                &id.span,
                            );
                            vec![(id.sym.to_string(), param)]
                        }
                        _ => self.error_param(
                            rest_span,
                            DiagnosticMessage::CouldNotUnderstandRestParameter,
                        ),
                    },
                    None => {
                        self.error_param(&it.span, DiagnosticMessage::RestParamMustBeLabelAnnotated)
                    }
                })
                .collect(),
            _ => self.error_param(rest_span, DiagnosticMessage::RestParameterMustBeTuple),
        }
    }

    fn parse_arrow_parameter(
        &mut self,
        param: &Pat,
        parent_span: &Span,
    ) -> Vec<(String, HandlerParameter)> {
        match param {
            Pat::Ident(BindingIdent { id, type_ann }) => {
                assert!(type_ann.is_some());
                let comments = self.current_file.comments.get_leading(id.span.lo);
                let description = comments.and_then(parse_description_comment);
                let param = self.parse_parameter_type(
                    &type_ann.as_ref().unwrap().as_ref().type_ann,
                    !id.optional,
                    description,
                    &id.span,
                );
                vec![(id.sym.to_string(), param)]
            }
            Pat::Rest(RestPat { span, type_ann, .. }) => match type_ann {
                Some(it) => self.parse_arrow_param_from_type_expecting_tuple(&it.type_ann, span),
                None => self.error_param(span, DiagnosticMessage::RestParamMustBeTypeAnnotated),
            },
            Pat::Array(ArrayPat { span, .. })
            | Pat::Object(ObjectPat { span, .. })
            | Pat::Assign(AssignPat { span, .. })
            | Pat::Invalid(Invalid { span, .. }) => {
                self.error_param(span, DiagnosticMessage::ParameterPatternNotSupported)
            }
            Pat::Expr(_) => {
                self.error_param(parent_span, DiagnosticMessage::ParameterPatternNotSupported)
            }
        }
    }

    fn validate_pattern_was_consumed(&mut self, e: FnHandler, ptn_span: &Span) -> FnHandler {
        // validate that pattern has required paths parameters
        let path_params = parse_pattern_params(&e.pattern);

        for path_param in path_params {
            // make sure some param exist for it
            let found = e.parameters.iter().find(|(key, _)| key == &path_param);
            if found.is_none() {
                self.errors.push(Diagnostic {
                    message: DiagnosticMessage::UnmatchedPathParameter(path_param.to_string()),
                    file_name: self.current_file.module.fm.name.clone(),
                    span: *ptn_span,
                });
            }
        }
        e
    }
    fn prop_name_name(key: &PropName) -> Span {
        match key {
            PropName::Ident(_) => todo!(),
            PropName::Str(_) => todo!(),
            PropName::Num(_) => todo!(),
            PropName::Computed(ComputedPropName { span, .. }) => *span,
            PropName::BigInt(_) => todo!(),
        }
    }
    fn get_endpoint_comments(&mut self, key: &PropName) -> EndpointComments {
        let comments = self
            .current_file
            .comments
            .get_leading(Self::prop_name_name(key).lo);

        let mut endpoint_comments = EndpointComments {
            summary: None,
            description: None,
        };
        if let Some(comments) = comments {
            parse_endpoint_comments(&mut endpoint_comments, comments);
        }
        endpoint_comments
    }
    fn validate_handler_func(
        &mut self,
        is_async: bool,
        is_generator: bool,
        type_params: &Option<Box<TsTypeParamDecl>>,
    ) {
        assert!(is_async);
        assert!(!is_generator);
        assert!(type_params.is_none());
    }
    fn method_from_func_expr(&mut self, key: &PropName, func: &FnExpr) -> Result<FnHandler> {
        let FnExpr { function, .. } = func;
        let Function {
            params,
            span: parent_span,
            is_generator,
            is_async,
            type_params,
            return_type,
            ..
        } = &**function;
        self.validate_handler_func(*is_async, *is_generator, type_params);

        let (method_kind, pattern, ptn_span) = Self::parse_key(key);
        let endpoint_comments = self.get_endpoint_comments(key);

        let e = FnHandler {
            parameters: params
                .iter()
                .flat_map(|it| self.parse_arrow_parameter(&it.pat, parent_span))
                .collect(),
            method_kind,
            pattern,
            summary: endpoint_comments.summary,
            description: endpoint_comments.description,
            return_type: self.convert_to_json_schema(extract_promise(
                &return_type.as_ref().unwrap().as_ref().type_ann,
            )),
        };

        Ok(self.validate_pattern_was_consumed(e, &ptn_span))
    }
    fn method_from_arrow_expr(&mut self, key: &PropName, arrow: &ArrowExpr) -> Result<FnHandler> {
        let ArrowExpr {
            params,
            is_async,
            is_generator,
            type_params,
            return_type,
            span: parent_span,
            ..
        } = arrow;
        self.validate_handler_func(*is_async, *is_generator, type_params);

        let (method_kind, pattern, ptn_span) = Self::parse_key(key);
        let endpoint_comments = self.get_endpoint_comments(key);

        let e = FnHandler {
            parameters: params
                .iter()
                .flat_map(|it| self.parse_arrow_parameter(it, parent_span))
                .collect(),
            method_kind,
            pattern,
            summary: endpoint_comments.summary,
            description: endpoint_comments.description,
            return_type: self.convert_to_json_schema(extract_promise(
                &return_type.as_ref().unwrap().as_ref().type_ann,
            )),
        };

        Ok(self.validate_pattern_was_consumed(e, &ptn_span))
    }
    fn endpoint_from_prop(&mut self, prop: &Prop) -> Result<FnHandler> {
        if let Prop::KeyValue(KeyValueProp { key, value }) = prop {
            if let Expr::Arrow(arr) = &**value {
                return self.method_from_arrow_expr(key, arr);
            }
            if let Expr::Fn(func) = &**value {
                return self.method_from_func_expr(key, func);
            }
            let (method_kind, pattern, _ptn_span) = Self::parse_key(key);
            if method_kind == MethodKind::Use {
                return Ok(FnHandler {
                    method_kind,
                    pattern,
                    summary: None,
                    description: None,
                    parameters: vec![],
                    return_type: JsonSchema::Any,
                });
            }
        }
        panic!("not a key value prop with arrow or function")
    }

    #[allow(clippy::to_string_in_format_args)]
    fn parse_export_default_comments(&mut self, comments: Vec<Comment>) {
        for c in comments {
            if c.kind == CommentKind::Block {
                let s = c.text;
                let parsed =
                    jsdoc::parse(Input::new(BytePos(0), BytePos(s.as_bytes().len() as _), &s));
                match parsed {
                    Ok((rest, parsed)) => {
                        self.info.description = Some(trim_description_comments(
                            parsed.description.value.to_string(),
                        ));
                        if rest.len() > 0 {
                            self.info.description = Some(format!(
                                "{}\n{}",
                                self.info.description.as_ref().unwrap_or(&String::new()),
                                rest.to_string()
                            ));
                        }
                        for tag in parsed.tags {
                            match tag.tag {
                                Tag::Version(VersionTag { value, .. }) => {
                                    self.info.version = Some(value.value.to_string());
                                }
                                Tag::Unknown(UnknownTag { extras, .. }) => {
                                    match &*tag.tag_name.value {
                                        "title" => {
                                            self.info.title = Some(extras.value.to_string());
                                        }
                                        _ => todo!(),
                                    }
                                }
                                _ => panic!("Unknown tag {tag:?}"),
                            }
                        }
                    }
                    Err(_) => panic!("cannot parse jsdocs"),
                }
            }
        }
    }
}

impl<'a> Visit for ExtractExportDefaultVisitor<'a> {
    fn visit_export_default_expr(&mut self, n: &ExportDefaultExpr) {
        let comments = self.current_file.comments.get_leading(n.span.lo);
        if let Some(comments) = comments {
            self.parse_export_default_comments(comments);
        }
        if let Expr::Object(lit) = &*n.expr {
            self.found_default_export = true;
            for prop in &lit.props {
                match prop {
                    PropOrSpread::Prop(prop) => {
                        let method = self.endpoint_from_prop(prop);
                        if let Ok(method) = method {
                            self.handlers.push(method);
                        }
                    }
                    PropOrSpread::Spread(_) => todo!(),
                }
            }
        }
    }
}

#[must_use]
pub fn parse_pattern_params(pattern: &str) -> Vec<String> {
    // parse open api parameters from pattern
    let mut params = vec![];
    let chars = pattern.chars();
    let mut current = String::new();
    for c in chars {
        if c == '{' {
            current = String::new();
        } else if c == '}' {
            params.push(current.clone());
        } else {
            current.push(c);
        }
    }
    params
}

fn operation_parameter_in_path_or_query(name: &str, pattern: &str) -> ParameterIn {
    // if name is in pattern return path
    let ptn_params = parse_pattern_params(pattern);
    if ptn_params.contains(&name.to_string()) {
        ParameterIn::Path
    } else {
        ParameterIn::Query
    }
}
fn to_operation_parameter(
    key: String,
    param: HandlerParameter,
    pattern: &str,
) -> Vec<ParameterObject> {
    match param {
        HandlerParameter::PathOrQuery {
            schema,
            required,
            description,
            ..
        } => vec![ParameterObject {
            in_: operation_parameter_in_path_or_query(&key, pattern),
            name: key,
            required,
            description,
            schema,
        }],
        HandlerParameter::HeaderOrCookie {
            required,
            description,
            kind,
            schema,
            ..
        } => vec![ParameterObject {
            in_: match kind {
                HeaderOrCookie::Header => ParameterIn::Header,
                HeaderOrCookie::Cookie => ParameterIn::Cookie,
            },
            name: key,
            required,
            description,
            schema,
        }],
        HandlerParameter::Context => vec![],
    }
}

fn endpoint_to_operation_object(endpoint: FnHandler, pattern: &str) -> OperationObject {
    OperationObject {
        summary: endpoint.summary,
        description: endpoint.description,
        parameters: endpoint
            .parameters
            .into_iter()
            .flat_map(|(key, param)| to_operation_parameter(key, param, pattern))
            .collect(),
        json_response: endpoint.return_type,
    }
}

fn add_endpoint_to_path(path: &mut open_api_ast::ApiPath, endpoint: FnHandler) {
    log::debug!("adding endpoint to path");

    let kind = endpoint.method_kind;
    let op = Some(endpoint_to_operation_object(endpoint, &path.pattern));
    match kind {
        MethodKind::Get => path.get = op,
        MethodKind::Post => path.post = op,
        MethodKind::Use => {}
    }
}

fn endpoints_to_paths(endpoints: Vec<FnHandler>) -> Vec<open_api_ast::ApiPath> {
    let mut acc: Vec<open_api_ast::ApiPath> = vec![];
    for endpoint in endpoints {
        let found = acc.iter_mut().find(|x| x.pattern == endpoint.pattern);
        if let Some(path) = found {
            add_endpoint_to_path(path, endpoint);
        } else {
            let mut path = open_api_ast::ApiPath::from_pattern(&endpoint.pattern);
            add_endpoint_to_path(&mut path, endpoint);
            acc.push(path);
        };
    }
    acc
}

pub struct ExtractResult {
    pub errors: Vec<Diagnostic>,
    pub open_api: OpenApi,
    pub handlers: Vec<FnHandler>,
}

pub fn extract_schema(
    files: &AHashMap<FileName, ParsedModule>,
    current_file: &ParsedModule,
) -> ExtractResult {
    log::debug!("start extract_schema schema");

    let mut visitor = ExtractExportDefaultVisitor::new(files, current_file);
    visitor.visit_module(&current_file.module.module);

    if !visitor.found_default_export {
        panic!("todo add it to errors")
    }

    log::debug!("visited module");
    let open_api = OpenApi {
        info: visitor.info,
        paths: endpoints_to_paths(visitor.handlers.clone()),
        components: visitor.components,
    };
    log::debug!("extracted schema");

    ExtractResult {
        handlers: visitor.handlers,
        open_api,
        errors: visitor.errors,
    }
}
