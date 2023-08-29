use crate::diag::{Diagnostic, DiagnosticMessage};
use crate::open_api_ast::{
    Definition, JsonRequestBody, JsonSchema, OpenApi, OperationObject, ParameterIn, ParameterObject,
};
use crate::type_to_schema::TypeToSchema;
use crate::{open_api_ast, ParsedModule};
use anyhow::anyhow;
use anyhow::Result;
use core::{fmt, panic};
use jsdoc::ast::{SummaryTag, Tag, UnknownTag, VersionTag};
use jsdoc::Input;
use swc_common::comments::{Comment, CommentKind, Comments};
use swc_common::{collections::AHashMap, FileName};
use swc_common::{BytePos, Span, DUMMY_SP};
use swc_ecma_ast::{
    ArrayPat, ArrowExpr, AssignPat, AssignProp, BigInt, BindingIdent, ComputedPropName,
    ExportDefaultExpr, Expr, FnExpr, Function, GetterProp, Ident, Invalid, KeyValueProp, Lit,
    MethodProp, Number, ObjectPat, Pat, Prop, PropName, PropOrSpread, RestPat, SetterProp, Str,
    Tpl, TsEntityName, TsKeywordType, TsKeywordTypeKind, TsTupleType, TsType, TsTypeAnn,
    TsTypeParamDecl, TsTypeParamInstantiation, TsTypeRef,
};
use swc_ecma_visit::Visit;

fn maybe_extract_promise(typ: &TsType) -> &TsType {
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
    return typ;
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
    PathOrQueryOrBody {
        schema: JsonSchema,
        required: bool,
        description: Option<String>,
    },
    HeaderOrCookie {
        kind: HeaderOrCookie,
        schema: JsonSchema,
        required: bool,
        description: Option<String>,
    },
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum MethodKind {
    Get,
    Post,
    Put,
    Delete,
    Patch,
    Options,
    Use,
}
impl fmt::Display for MethodKind {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            MethodKind::Get => write!(f, "get"),
            MethodKind::Post => write!(f, "post"),
            MethodKind::Put => write!(f, "put"),
            MethodKind::Delete => write!(f, "delete"),
            MethodKind::Patch => write!(f, "patch"),
            MethodKind::Options => write!(f, "options"),
            MethodKind::Use => write!(f, "use"),
        }
    }
}

impl MethodKind {
    pub fn text_len(&self) -> usize {
        return self.to_string().len();
    }
}

#[derive(Debug, Clone)]
pub struct ParsedPattern {
    pub raw_span: Span,
    pub open_api_pattern: String,
    pub method_kind: MethodKind,
    pub path_params: Vec<String>,
}

fn parse_pattern_params(pattern: &str) -> Vec<String> {
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
#[derive(Debug, Clone)]
pub struct FnHandler {
    pub pattern: ParsedPattern,
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
    fn parse_prefix(key: &str) -> MethodKind {
        if key.starts_with("GET") {
            return MethodKind::Get;
        }
        if key.starts_with("POST") {
            return MethodKind::Post;
        }
        if key.starts_with("PUT") {
            return MethodKind::Put;
        }
        if key.starts_with("DELETE") {
            return MethodKind::Delete;
        }
        if key.starts_with("PATCH") {
            return MethodKind::Patch;
        }
        if key.starts_with("OPTIONS") {
            return MethodKind::Options;
        }
        if key.starts_with("USE") {
            return MethodKind::Use;
        }
        panic!("not supported")
    }
    fn parse_raw_pattern_str(key: &str, span: &Span) -> ParsedPattern {
        let method_kind = Self::parse_prefix(key);
        let prefix_len = method_kind.text_len();
        let rest_of_key = &key[prefix_len..];
        let path_params = parse_pattern_params(rest_of_key);
        ParsedPattern {
            raw_span: span.clone(),
            open_api_pattern: rest_of_key.to_string(),
            method_kind,
            path_params,
        }
    }
    fn parse_key(&mut self, key: &PropName) -> Result<ParsedPattern> {
        match key {
            PropName::Computed(ComputedPropName { expr, .. }) => match &**expr {
                Expr::Lit(Lit::Str(Str { span, value, .. })) => {
                    Ok(Self::parse_raw_pattern_str(&value.to_string(), span))
                }
                Expr::Tpl(Tpl {
                    span,
                    exprs,
                    quasis,
                }) => {
                    assert!(exprs.is_empty());
                    assert!(quasis.len() == 1);
                    let first_quasis = quasis.first().unwrap();
                    Ok(Self::parse_raw_pattern_str(
                        &first_quasis.raw.to_string(),
                        span,
                    ))
                }
                _ => panic!("not TaggedTpl"),
            },
            PropName::Ident(Ident { span, .. })
            | PropName::Str(Str { span, .. })
            | PropName::Num(Number { span, .. })
            | PropName::BigInt(BigInt { span, .. }) => {
                self.errors.push(Diagnostic {
                    message: DiagnosticMessage::MustBeComputedKeyWithMethodAndPattern,
                    file_name: self.current_file.module.fm.name.clone(),
                    span: *span,
                });
                Err(anyhow!("not computed key"))
            }
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
            // We store type in an Option to support self-recursion.
            // When we encounter the type while transforming it we return string with the type name.
            // And we need the option to allow a type to refer to itself before it has been resolved.
            match v {
                Some(s) => kvs.push((k, s)),
                None => unreachable!("started resolving a type and did not finish it"),
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
            let name = i.sym.to_string();
            if name == "Header" || name == "Cookie" {
                return self.parse_lib_param(i, &tref.type_params, required, description);
            }
        }
        HandlerParameter::PathOrQueryOrBody {
            schema: self.convert_to_json_schema(ty),
            required,
            description,
        }
    }
    fn parse_parameter_type(
        &mut self,
        ty: &TsType,
        required: bool,
        description: Option<String>,
    ) -> HandlerParameter {
        match ty {
            TsType::TsTypeRef(tref) => {
                self.parse_type_ref_parameter(tref, ty, required, description)
            }
            _ => HandlerParameter::PathOrQueryOrBody {
                schema: self.convert_to_json_schema(ty),
                required,
                description,
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
                            let param =
                                self.parse_parameter_type(&it.ty, !id.optional, description);
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

    fn validate_pattern_was_consumed(&mut self, e: FnHandler) -> FnHandler {
        for path_param in &e.pattern.path_params {
            // make sure some param exist for it
            let found = e.parameters.iter().find(|(key, _)| key == path_param);
            if found.is_none() {
                self.errors.push(Diagnostic {
                    message: DiagnosticMessage::UnmatchedPathParameter(path_param.to_string()),
                    file_name: self.current_file.module.fm.name.clone(),
                    span: e.pattern.raw_span.clone(),
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
        is_generator: bool,
        type_params: &Option<Box<TsTypeParamDecl>>,
    ) {
        assert!(!is_generator);
        assert!(type_params.is_none());
    }
    fn method_from_func_expr(&mut self, key: &PropName, func: &FnExpr) -> Result<FnHandler> {
        let FnExpr { function, .. } = func;
        let Function {
            params,
            span: parent_span,
            is_generator,
            type_params,
            return_type,
            ..
        } = &**function;
        self.validate_handler_func(*is_generator, type_params);

        let pattern = self.parse_key(key)?;
        let endpoint_comments = self.get_endpoint_comments(key);

        let e = FnHandler {
            parameters: params
                .iter()
                .flat_map(|it| self.parse_arrow_parameter(&it.pat, parent_span))
                .collect(),
            pattern,
            summary: endpoint_comments.summary,
            description: endpoint_comments.description,
            return_type: self.convert_to_json_schema(maybe_extract_promise(
                &return_type.as_ref().unwrap().as_ref().type_ann,
            )),
        };

        Ok(self.validate_pattern_was_consumed(e))
    }

    fn extract_return_type_for_function(
        &mut self,
        return_type: &Option<Box<TsTypeAnn>>,
        span: &Span,
    ) -> TsType {
        match return_type.as_ref() {
            Some(t) => (*t.type_ann).clone(),
            None => {
                self.errors.push(Diagnostic {
                    message: DiagnosticMessage::HandlerMustAnnotateReturnType,
                    file_name: self.current_file.module.fm.name.clone(),
                    span: *span,
                });

                TsType::TsKeywordType(TsKeywordType {
                    span: DUMMY_SP,
                    kind: TsKeywordTypeKind::TsAnyKeyword,
                })
            }
        }
    }

    fn method_from_arrow_expr(&mut self, key: &PropName, arrow: &ArrowExpr) -> Result<FnHandler> {
        let ArrowExpr {
            params,
            is_generator,
            type_params,
            return_type,
            span: parent_span,
            ..
        } = arrow;
        self.validate_handler_func(*is_generator, type_params);

        let pattern = self.parse_key(key)?;
        let endpoint_comments = self.get_endpoint_comments(key);

        let ret_ty = self.extract_return_type_for_function(return_type, parent_span);
        let e = FnHandler {
            parameters: params
                .iter()
                .flat_map(|it| self.parse_arrow_parameter(it, parent_span))
                .collect(),
            pattern,
            summary: endpoint_comments.summary,
            description: endpoint_comments.description,
            return_type: self.convert_to_json_schema(maybe_extract_promise(&ret_ty)),
        };

        Ok(self.validate_pattern_was_consumed(e))
    }
    fn get_prop_name_span(key: &PropName) -> Span {
        let span = match key {
            PropName::Computed(ComputedPropName { span, .. })
            | PropName::Ident(Ident { span, .. })
            | PropName::Str(Str { span, .. })
            | PropName::Num(Number { span, .. })
            | PropName::BigInt(BigInt { span, .. }) => span,
        };
        return *span;
    }
    fn get_prop_span(prop: &Prop) -> Span {
        match &prop {
            Prop::Shorthand(Ident { span, .. }) => *span,
            Prop::KeyValue(KeyValueProp { key, .. }) => Self::get_prop_name_span(key),
            Prop::Assign(AssignProp { ref key, .. }) => key.span,
            Prop::Getter(GetterProp { span, .. }) => *span,
            Prop::Setter(SetterProp { span, .. }) => *span,
            Prop::Method(MethodProp { key, .. }) => Self::get_prop_name_span(key),
        }
    }
    fn endpoint_from_prop(&mut self, prop: &Prop) -> Result<FnHandler> {
        if let Prop::KeyValue(KeyValueProp { key, value }) = prop {
            if let Expr::Arrow(arr) = &**value {
                return self.method_from_arrow_expr(key, arr);
            }
            if let Expr::Fn(func) = &**value {
                return self.method_from_func_expr(key, func);
            }
            let pattern = self.parse_key(key)?;
            if pattern.method_kind == MethodKind::Use {
                return Ok(FnHandler {
                    pattern,
                    summary: None,
                    description: None,
                    parameters: vec![],
                    return_type: JsonSchema::Any,
                });
            }
        }
        let span = Self::get_prop_span(prop);
        self.errors.push(Diagnostic {
            message: DiagnosticMessage::HandlerMustBeAKeyValuePairWithStringAndFunction,
            file_name: self.current_file.module.fm.name.clone(),
            span,
        });
        Err(anyhow!("not a key value prop with arrow or function"))
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

pub enum FunctionParameterIn {
    Path,
    Query,
    Body,
    InvalidComplexPathParameter,
}

fn is_type_simple(it: &JsonSchema, components: &Vec<Definition>) -> bool {
    match it {
        JsonSchema::Ref(r) => {
            let def = components
                .iter()
                .find(|it| &it.name == r)
                .expect("can always find ref in json schema at this point");
            is_type_simple(&def.schema, components)
        }
        JsonSchema::AnyOf(vs) => vs.iter().all(|it| is_type_simple(it, components)),
        JsonSchema::Null
        | JsonSchema::Boolean
        | JsonSchema::String
        | JsonSchema::Number
        | JsonSchema::Integer
        | JsonSchema::Const(_) => true,
        JsonSchema::AllOf(_)
        | JsonSchema::Any
        | JsonSchema::Object { .. }
        | JsonSchema::Array(_)
        | JsonSchema::Tuple { .. } => false,
    }
}

pub fn operation_parameter_in_path_or_query_or_body(
    name: &str,
    pattern: &ParsedPattern,
    schema: &JsonSchema,
    components: &Vec<Definition>,
) -> FunctionParameterIn {
    // if name is in pattern return path
    if pattern.path_params.contains(&name.to_string()) {
        if is_type_simple(schema, components) {
            FunctionParameterIn::Path
        } else {
            FunctionParameterIn::InvalidComplexPathParameter
        }
    } else {
        if is_type_simple(schema, components) {
            FunctionParameterIn::Query
        } else {
            FunctionParameterIn::Body
        }
    }
}

struct EndpointToPath<'a> {
    errors: Vec<Diagnostic>,
    components: &'a Vec<Definition>,
    current_file: &'a FileName,
}

impl<'a> EndpointToPath<'a> {
    fn endpoint_to_operation_object(&mut self, endpoint: FnHandler) -> OperationObject {
        let mut parameters: Vec<ParameterObject> = vec![];
        let mut json_request_body: Option<JsonRequestBody> = None;
        for (key, param) in endpoint.parameters.into_iter() {
            match param {
                HandlerParameter::PathOrQueryOrBody {
                    schema,
                    required,
                    description,
                    ..
                } => {
                    match operation_parameter_in_path_or_query_or_body(
                        &key,
                        &endpoint.pattern,
                        &schema,
                        self.components,
                    ) {
                        FunctionParameterIn::Path => parameters.push(ParameterObject {
                            in_: ParameterIn::Path,
                            name: key,
                            required,
                            description,
                            schema,
                        }),
                        FunctionParameterIn::Query => parameters.push(ParameterObject {
                            in_: ParameterIn::Query,
                            name: key,
                            required,
                            description,
                            schema,
                        }),
                        FunctionParameterIn::Body => {
                            assert!(json_request_body.is_none());
                            json_request_body = Some(JsonRequestBody {
                                schema,
                                description,
                                required,
                            });
                        }
                        FunctionParameterIn::InvalidComplexPathParameter => {
                            self.errors.push(Diagnostic {
                                message: DiagnosticMessage::ComplexPathParameterNotSupported,
                                file_name: self.current_file.clone(),
                                span: endpoint.pattern.raw_span.clone(),
                            });
                        }
                    }
                }
                HandlerParameter::HeaderOrCookie {
                    required,
                    description,
                    kind,
                    schema,
                    ..
                } => parameters.push(ParameterObject {
                    in_: match kind {
                        HeaderOrCookie::Header => ParameterIn::Header,
                        HeaderOrCookie::Cookie => ParameterIn::Cookie,
                    },
                    name: key,
                    required,
                    description,
                    schema,
                }),
            };
        }
        OperationObject {
            summary: endpoint.summary,
            description: endpoint.description,
            parameters,
            json_response_body: endpoint.return_type,
            json_request_body,
        }
    }
    fn add_endpoint_to_path(&mut self, path: &mut open_api_ast::ApiPath, endpoint: FnHandler) {
        log::debug!("adding endpoint to path");

        let kind = endpoint.pattern.method_kind;
        let op = Some(self.endpoint_to_operation_object(endpoint));
        match kind {
            MethodKind::Get => path.get = op,
            MethodKind::Post => path.post = op,
            MethodKind::Put => path.put = op,
            MethodKind::Delete => path.delete = op,
            MethodKind::Patch => path.patch = op,
            MethodKind::Options => path.options = op,
            MethodKind::Use => {}
        }
    }

    fn endpoints_to_paths(&mut self, endpoints: Vec<FnHandler>) -> Vec<open_api_ast::ApiPath> {
        let mut acc: Vec<open_api_ast::ApiPath> = vec![];
        for endpoint in endpoints {
            let found = acc
                .iter_mut()
                .find(|x| x.pattern == endpoint.pattern.open_api_pattern);
            if let Some(path) = found {
                self.add_endpoint_to_path(path, endpoint);
            } else {
                let mut path =
                    open_api_ast::ApiPath::from_pattern(&endpoint.pattern.open_api_pattern);
                self.add_endpoint_to_path(&mut path, endpoint);
                acc.push(path);
            };
        }
        acc
    }
}

pub struct ExtractResult {
    pub errors: Vec<Diagnostic>,
    pub open_api: OpenApi,
    pub handlers: Vec<FnHandler>,
    pub components: Vec<Definition>,
}

pub fn extract_schema(
    files: &AHashMap<FileName, ParsedModule>,
    current_file: &ParsedModule,
) -> ExtractResult {
    log::debug!("start extract_schema schema");

    let mut visitor = ExtractExportDefaultVisitor::new(files, current_file);
    visitor.visit_module(&current_file.module.module);

    if !visitor.found_default_export {
        visitor.errors.push(Diagnostic {
            message: DiagnosticMessage::CouldNotFindDefaultExport,
            file_name: current_file.module.fm.name.clone(),
            span: DUMMY_SP,
        })
    }

    log::debug!("visited module");
    let mut transformer = EndpointToPath {
        errors: visitor.errors,
        components: &visitor.components,
        current_file: &current_file.module.fm.name,
    };
    let paths = transformer.endpoints_to_paths(visitor.handlers.clone());
    log::debug!("transformed endpoints to paths");
    let open_api = OpenApi {
        info: visitor.info,
        paths: paths,
        components: visitor.components.clone(),
    };
    log::debug!("extracted schema");

    ExtractResult {
        handlers: visitor.handlers,
        open_api,
        errors: transformer.errors,
        components: visitor.components,
    }
}
