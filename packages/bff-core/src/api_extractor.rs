use crate::diag::{span_to_loc, Diagnostic, DiagnosticMessage};
use crate::open_api_ast::{
    self, Definition, Info, JsonRequestBody, JsonSchema, OpenApi, OperationObject, ParameterIn,
    ParameterObject,
};
use crate::type_to_schema::TypeToSchema;
use crate::ParsedModule;
use anyhow::anyhow;
use anyhow::Result;
use core::fmt;
use jsdoc::ast::{SummaryTag, Tag, UnknownTag, VersionTag};
use jsdoc::Input;
use std::rc::Rc;
use swc_common::comments::{Comment, CommentKind, Comments};
use swc_common::{BytePos, Span, DUMMY_SP};
use swc_ecma_ast::{
    ArrayPat, ArrowExpr, AssignPat, AssignProp, BigInt, BindingIdent, ComputedPropName,
    ExportDefaultExpr, Expr, FnExpr, Function, GetterProp, Ident, Invalid, KeyValueProp, Lit,
    MethodProp, Number, ObjectPat, Pat, Prop, PropName, PropOrSpread, RestPat, SetterProp,
    SpreadElement, Str, Tpl, TsEntityName, TsKeywordType, TsKeywordTypeKind, TsTupleType, TsType,
    TsTypeAnn, TsTypeParamDecl, TsTypeParamInstantiation, TsTypeRef,
};
use swc_ecma_visit::Visit;

fn maybe_extract_promise(typ: &TsType) -> &TsType {
    if let TsType::TsTypeRef(refs) = typ {
        if let TsEntityName::Ident(i) = &refs.type_name {
            // if name is promise
            if i.sym == *"Promise" {
                match refs.type_params.as_ref() {
                    Some(inst) => {
                        let ts_type = inst.params.get(0);
                        match ts_type {
                            Some(ts_type) => return ts_type,
                            None => {}
                        }
                    }
                    None => {}
                }
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
        span: Span,
    },
    HeaderOrCookie {
        kind: HeaderOrCookie,
        schema: JsonSchema,
        required: bool,
        description: Option<String>,
    },
    Context,
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
    pub method_kind: MethodKind,
}

pub trait FileManager {
    fn get_or_fetch_file(&mut self, name: &str) -> Option<Rc<ParsedModule>>;
    fn get_existing_file(&self, name: &str) -> Option<Rc<ParsedModule>>;
}

pub struct ExtractExportDefaultVisitor<'a, R: FileManager> {
    files: &'a mut R,
    current_file: &'a str,
    handlers: Vec<FnHandler>,
    components: Vec<Definition>,
    found_default_export: bool,
    errors: Vec<Diagnostic>,
    info: open_api_ast::Info,
}
impl<'a, R: FileManager> ExtractExportDefaultVisitor<'a, R> {
    fn new(files: &'a mut R, current_file: &'a str) -> ExtractExportDefaultVisitor<'a, R> {
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

    while v
        .last()
        .expect("we just checked that it is not empty")
        .is_ascii_whitespace()
        || v.last().expect("we just checked that it is not empty") == &'*'
    {
        v.pop();
    }

    v.into_iter().collect()
}

struct EndpointComments {
    pub summary: Option<String>,
    pub description: Option<String>,
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
impl<'a, R: FileManager> ExtractExportDefaultVisitor<'a, R> {
    fn build_error(&self, span: &Span, msg: DiagnosticMessage) -> Diagnostic {
        let file = self.files.get_existing_file(&self.current_file);
        match file {
            Some(file) => {
                let (loc_lo, loc_hi) =
                    span_to_loc(span, &file.module.source_map, file.module.fm.end_pos);

                Diagnostic::KnownFile {
                    message: msg,
                    file_name: self.current_file.to_string(),
                    span: *span,
                    loc_lo,
                    loc_hi,
                }
            }
            None => Diagnostic::UnknownFile {
                message: msg,
                current_file: self.current_file.to_string(),
            },
        }
    }
    fn push_error(&mut self, span: &Span, msg: DiagnosticMessage) {
        self.errors.push(self.build_error(span, msg));
    }

    #[allow(clippy::to_string_in_format_args)]
    fn parse_endpoint_comments(&mut self, acc: &mut EndpointComments, comments: Vec<Comment>) {
        for c in comments {
            if c.kind == CommentKind::Block {
                let s = c.text;
                let parsed =
                    jsdoc::parse(Input::new(BytePos(0), BytePos(s.as_bytes().len() as _), &s));
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
                        for tag_item in parsed.tags {
                            match tag_item.tag {
                                Tag::Summary(SummaryTag { text, .. }) => {
                                    acc.summary = Some(text.value.to_string());
                                }
                                tag => self.push_error(
                                    &tag_item.span,
                                    DiagnosticMessage::UnknownJsDocTag(tag.clone()),
                                ),
                            }
                        }
                    }
                    Err(_) => self.push_error(&c.span, DiagnosticMessage::CannotParseJsDoc),
                }
            }
        }
    }
    fn parse_description_comment(&mut self, comments: Vec<Comment>, span: &Span) -> Option<String> {
        if comments.len() != 1 {
            self.push_error(span, DiagnosticMessage::CannotParseJsDoc);

            return None;
        }
        let first = comments
            .into_iter()
            .next()
            .expect("we just checked the length");
        if first.kind == CommentKind::Block {
            let s = first.text;
            let parsed = jsdoc::parse(Input::new(BytePos(0), BytePos(s.as_bytes().len() as _), &s));
            match parsed {
                Ok((rest, parsed)) => {
                    if !rest.is_empty() {
                        self.push_error(&first.span, DiagnosticMessage::CannotParseJsDoc);
                    }
                    if !parsed.tags.is_empty() {
                        for tag in parsed.tags {
                            self.push_error(&tag.span, DiagnosticMessage::CannotParseJsDoc);
                        }
                    }
                    return Some(trim_description_comments(
                        parsed.description.value.to_string(),
                    ));
                }
                Err(_) => self.push_error(&first.span, DiagnosticMessage::CannotParseJsDoc),
            }
        }
        None
    }

    fn parse_raw_pattern_str(&mut self, key: &str, span: &Span) -> Result<ParsedPattern> {
        let path_params = parse_pattern_params(key);
        Ok(ParsedPattern {
            raw_span: span.clone(),
            open_api_pattern: key.to_string(),
            path_params,
        })
    }
    fn parse_key(&mut self, key: &PropName) -> Result<ParsedPattern> {
        match key {
            PropName::Computed(ComputedPropName { expr, span, .. }) => match &**expr {
                Expr::Lit(Lit::Str(Str { span, value, .. })) => {
                    self.parse_raw_pattern_str(&value.to_string(), span)
                }
                Expr::Tpl(Tpl {
                    span,
                    exprs,
                    quasis,
                }) => {
                    if !exprs.is_empty() {
                        self.push_error(span, DiagnosticMessage::TemplateMustBeOfSingleString);

                        return Err(anyhow!("not single string"));
                    }
                    if quasis.len() != 1 {
                        self.push_error(span, DiagnosticMessage::TemplateMustBeOfSingleString);

                        return Err(anyhow!("not single string"));
                    }
                    let first_quasis = quasis.first().expect("we just checked the length");
                    self.parse_raw_pattern_str(&first_quasis.raw.to_string(), span)
                }
                _ => {
                    self.push_error(
                        span,
                        DiagnosticMessage::MustBeComputedKeyWithMethodAndPatternMustBeString,
                    );

                    Err(anyhow!("not computed key"))
                }
            },
            PropName::Ident(Ident { span, .. })
            | PropName::Str(Str { span, .. })
            | PropName::Num(Number { span, .. })
            | PropName::BigInt(BigInt { span, .. }) => {
                self.push_error(span, DiagnosticMessage::MustBeComputedKey);

                Err(anyhow!("not computed key"))
            }
        }
    }

    fn extend_components(&mut self, defs: Vec<Definition>, span: &Span) {
        for d in defs {
            let found = self.components.iter_mut().find(|x| x.name == d.name);
            if let Some(found) = found {
                if found.schema != d.schema {
                    self.push_error(span, DiagnosticMessage::TwoDifferentTypesWithTheSameName);
                }
            } else {
                self.components.push(d);
            }
        }
    }

    fn convert_to_json_schema(&mut self, ty: &TsType, span: &Span) -> JsonSchema {
        let mut to_schema = TypeToSchema::new(self.files, self.current_file);
        let res = to_schema.convert_ts_type(ty);
        self.errors.extend(to_schema.errors);

        let mut kvs = vec![];
        for (k, v) in to_schema.components {
            // We store type in an Option to support self-recursion.
            // When we encounter the type while transforming it we return string with the type name.
            // And we need the option to allow a type to refer to itself before it has been resolved.
            match v {
                Some(s) => kvs.push((k, s)),
                None => self.push_error(
                    span,
                    DiagnosticMessage::CannotResolveTypeReferenceOnExtracting(k),
                ),
            }
        }

        kvs.sort_by(|(ka, _), (kb, _)| ka.cmp(kb));
        let ext: Vec<Definition> = kvs.into_iter().map(|(_k, v)| v).collect();
        self.extend_components(ext, span);
        res
        // todo!()
    }
    fn parse_lib_param(
        &mut self,
        lib_ty_name: &Ident,
        params: &Option<Box<TsTypeParamInstantiation>>,
        required: bool,
        description: Option<String>,
    ) -> Result<HandlerParameter> {
        let name = lib_ty_name.sym.to_string();
        let name = name.as_str();
        match name {
            "Header" | "Cookie" => {
                let params = &params.as_ref();
                match params {
                    None => {
                        self.push_error(
                            &lib_ty_name.span,
                            DiagnosticMessage::TooManyParamsOnLibType,
                        );

                        return Err(anyhow!("Header/Cookie must have one type parameter"));
                    }
                    Some(params) => {
                        let params = &params.params;
                        if params.len() != 1 {
                            self.push_error(
                                &lib_ty_name.span,
                                DiagnosticMessage::TooManyParamsOnLibType,
                            );

                            return Err(anyhow!("Header/Cookie must have one type parameter"));
                        }

                        let ty = params[0].as_ref();
                        Ok(HandlerParameter::HeaderOrCookie {
                            kind: if name == "Header" {
                                HeaderOrCookie::Header
                            } else {
                                HeaderOrCookie::Cookie
                            },
                            schema: self.convert_to_json_schema(ty, &lib_ty_name.span),
                            required,
                            description,
                        })
                    }
                }
            }
            _ => unreachable!("not in lib: {} - should check before calling", name),
        }
    }

    fn parse_type_ref_parameter(
        &mut self,
        tref: &TsTypeRef,
        ty: &TsType,
        required: bool,
        description: Option<String>,
    ) -> Result<HandlerParameter> {
        if let TsEntityName::Ident(i) = &tref.type_name {
            let name = i.sym.to_string();
            if name == "Ctx" || name == "Context" {
                return Ok(HandlerParameter::Context);
            }
            if name == "Header" || name == "Cookie" {
                return self.parse_lib_param(i, &tref.type_params, required, description);
            }
        }
        Ok(HandlerParameter::PathOrQueryOrBody {
            schema: self.convert_to_json_schema(ty, &tref.span),
            required,
            description,
            span: tref.span,
        })
    }
    fn parse_parameter_type(
        &mut self,
        ty: &TsType,
        required: bool,
        description: Option<String>,
        span: &Span,
    ) -> Result<HandlerParameter> {
        match ty {
            TsType::TsTypeRef(tref) => {
                self.parse_type_ref_parameter(tref, ty, required, description)
            }
            _ => Ok(HandlerParameter::PathOrQueryOrBody {
                schema: self.convert_to_json_schema(ty, span),
                required,
                description,
                span: *span,
            }),
        }
    }

    fn get_current_file(&mut self) -> Result<Rc<ParsedModule>> {
        match self.files.get_or_fetch_file(&self.current_file) {
            Some(it) => Ok(it),
            None => {
                self.errors.push(self.build_error(
                    &DUMMY_SP,
                    DiagnosticMessage::CannotFindFileWhenConvertingToSchema(
                        self.current_file.to_string(),
                    ),
                ));
                Err(anyhow!("cannot find file: {}", self.current_file))
            }
        }
    }
    fn visit_current_file(&mut self) -> Result<()> {
        let file = self.get_current_file()?;
        let module = file.module.module.clone();
        Ok(self.visit_module(&module))
    }

    fn parse_arrow_param_from_type_expecting_tuple(
        &mut self,
        it: &TsType,
        rest_span: &Span,
    ) -> Result<Vec<(String, HandlerParameter)>> {
        match it {
            TsType::TsTypeRef(TsTypeRef {
                type_name,
                type_params,
                ..
            }) => {
                if type_params.is_some() {
                    self.push_error(rest_span, DiagnosticMessage::TsTypeParametersNotSupported);
                    return Err(anyhow!("error param"));
                }
                match &type_name {
                    TsEntityName::TsQualifiedName(_) => {
                        self.push_error(rest_span, DiagnosticMessage::TsQualifiedNameNotSupported);
                        return Err(anyhow!("error param"));
                    }
                    TsEntityName::Ident(i) => {
                        if let Some(alias) = self
                            .get_current_file()?
                            .locals
                            .type_aliases
                            .get(&(i.sym.clone(), i.span.ctxt))
                        {
                            return self
                                .parse_arrow_param_from_type_expecting_tuple(alias, rest_span);
                        }
                        self.push_error(
                            rest_span,
                            DiagnosticMessage::CouldNotResolveIdentifierOnPathParamTuple,
                        );
                        return Err(anyhow!("error param"));
                    }
                }
            }
            TsType::TsTupleType(TsTupleType { elem_types, .. }) => elem_types
                .iter()
                .map(|it| match &it.label {
                    Some(pat) => match pat {
                        Pat::Ident(BindingIdent { id, .. }) => {
                            let comments =
                                self.get_current_file()?.comments.get_leading(id.span.lo);
                            let description = comments
                                .and_then(|it| self.parse_description_comment(it, &id.span));
                            let param = self.parse_parameter_type(
                                &it.ty,
                                !id.optional,
                                description,
                                &id.span,
                            )?;
                            Ok((id.sym.to_string(), param))
                        }
                        _ => {
                            self.push_error(
                                rest_span,
                                DiagnosticMessage::CouldNotUnderstandRestParameter,
                            );
                            return Err(anyhow!("error param"));
                        }
                    },
                    None => {
                        self.push_error(
                            rest_span,
                            DiagnosticMessage::RestParamMustBeLabelAnnotated,
                        );
                        return Err(anyhow!("error param"));
                    }
                })
                .collect(),
            _ => {
                self.push_error(rest_span, DiagnosticMessage::RestParameterMustBeTuple);
                return Err(anyhow!("error param"));
            }
        }
    }

    fn parse_arrow_parameter(
        &mut self,
        param: &Pat,
        parent_span: &Span,
    ) -> Result<Vec<(String, HandlerParameter)>> {
        match param {
            Pat::Ident(BindingIdent { id, type_ann }) => {
                if type_ann.is_none() {
                    self.push_error(
                        &id.span,
                        DiagnosticMessage::ParameterIdentMustHaveTypeAnnotation,
                    );

                    return Err(anyhow!("error param"));
                }

                let comments = self.get_current_file()?.comments.get_leading(id.span.lo);
                let description =
                    comments.and_then(|it| self.parse_description_comment(it, &id.span));
                let ty = self.assert_and_extract_type_from_ann(type_ann, &id.span);
                let param = self.parse_parameter_type(&ty, !id.optional, description, &id.span)?;
                Ok(vec![(id.sym.to_string(), param)])
            }
            Pat::Rest(RestPat { span, type_ann, .. }) => match type_ann {
                Some(it) => self.parse_arrow_param_from_type_expecting_tuple(&it.type_ann, span),
                None => {
                    self.push_error(span, DiagnosticMessage::RestParamMustBeTypeAnnotated);
                    return Err(anyhow!("error param"));
                }
            },
            Pat::Array(ArrayPat { span, .. })
            | Pat::Object(ObjectPat { span, .. })
            | Pat::Assign(AssignPat { span, .. })
            | Pat::Invalid(Invalid { span, .. }) => {
                self.push_error(span, DiagnosticMessage::ParameterPatternNotSupported);
                return Err(anyhow!("error param"));
            }
            Pat::Expr(_) => {
                self.push_error(parent_span, DiagnosticMessage::ParameterPatternNotSupported);
                return Err(anyhow!("error param"));
            }
        }
    }

    fn validate_pattern_was_consumed(&mut self, e: FnHandler) -> FnHandler {
        for path_param in &e.pattern.path_params {
            // make sure some param exist for it
            let found = e.parameters.iter().find(|(key, _)| key == path_param);
            if found.is_none() {
                self.push_error(
                    &e.pattern.raw_span.clone(),
                    DiagnosticMessage::UnmatchedPathParameter(path_param.to_string()),
                );
            }
        }
        e
    }

    fn get_endpoint_comments(&mut self, key: &PropName) -> Result<EndpointComments> {
        let comments = self
            .get_current_file()?
            .comments
            .get_leading(get_prop_name_span(key).lo);

        let mut endpoint_comments = EndpointComments {
            summary: None,
            description: None,
        };
        if let Some(comments) = comments {
            self.parse_endpoint_comments(&mut endpoint_comments, comments);
        }
        Ok(endpoint_comments)
    }
    fn validate_handler_func(
        &mut self,
        is_generator: bool,
        type_params: &Option<Box<TsTypeParamDecl>>,
        span: &Span,
    ) -> Result<()> {
        if is_generator {
            self.push_error(span, DiagnosticMessage::HandlerCannotBeGenerator);

            return Err(anyhow!("cannot be generator"));
        }
        if type_params.is_some() {
            self.push_error(span, DiagnosticMessage::HandlerCannotHaveTypeParameters);

            return Err(anyhow!("cannot have type params"));
        }

        Ok(())
    }
    fn method_from_func_expr(
        &mut self,
        key: &PropName,
        func: &FnExpr,
        pattern: &ParsedPattern,
    ) -> Result<FnHandler> {
        let FnExpr { function, .. } = func;
        let Function {
            params,
            span: parent_span,
            is_generator,
            type_params,
            return_type,
            ..
        } = &**function;
        self.validate_handler_func(*is_generator, type_params, parent_span)?;

        let endpoint_comments = self.get_endpoint_comments(key)?;

        let return_type = self.assert_and_extract_type_from_ann(return_type, parent_span);
        let parameters = params
            .iter()
            .map(|it| self.parse_arrow_parameter(&it.pat, parent_span))
            .collect::<Result<Vec<_>>>()?;
        let parameters = parameters.into_iter().flatten().collect();
        let e = FnHandler {
            method_kind: self.parse_method_kind(key)?,
            parameters,
            pattern: pattern.clone(),
            summary: endpoint_comments.summary,
            description: endpoint_comments.description,
            return_type: self
                .convert_to_json_schema(maybe_extract_promise(&return_type), parent_span),
        };

        Ok(self.validate_pattern_was_consumed(e))
    }

    fn assert_and_extract_type_from_ann(
        &mut self,
        return_type: &Option<Box<TsTypeAnn>>,
        span: &Span,
    ) -> TsType {
        match return_type.as_ref() {
            Some(t) => (*t.type_ann).clone(),
            None => {
                self.push_error(span, DiagnosticMessage::HandlerMustAnnotateReturnType);

                TsType::TsKeywordType(TsKeywordType {
                    span: DUMMY_SP,
                    kind: TsKeywordTypeKind::TsAnyKeyword,
                })
            }
        }
    }

    fn parse_method_kind(&mut self, key: &PropName) -> Result<MethodKind> {
        match key {
            PropName::Ident(Ident { sym, span, .. }) => match sym.to_string().as_str() {
                "get" => Ok(MethodKind::Get),
                "post" => Ok(MethodKind::Post),
                "put" => Ok(MethodKind::Put),
                "delete" => Ok(MethodKind::Delete),
                "patch" => Ok(MethodKind::Patch),
                "options" => Ok(MethodKind::Options),
                "use" => Ok(MethodKind::Use),
                _ => {
                    self.push_error(span, DiagnosticMessage::NotAnHttpMethod);
                    Err(anyhow!("not a method"))
                }
            },
            _ => {
                let span = get_prop_name_span(key);
                self.push_error(&span, DiagnosticMessage::NotAnHttpMethod);
                Err(anyhow!("not a method"))
            }
        }
    }

    fn method_from_arrow_expr(
        &mut self,
        key: &PropName,
        arrow: &ArrowExpr,
        pattern: &ParsedPattern,
    ) -> Result<FnHandler> {
        let ArrowExpr {
            params,
            is_generator,
            type_params,
            return_type,
            span: parent_span,
            ..
        } = arrow;
        self.validate_handler_func(*is_generator, type_params, parent_span)?;

        let endpoint_comments = self.get_endpoint_comments(key)?;

        let ret_ty = self.assert_and_extract_type_from_ann(return_type, parent_span);
        let e = FnHandler {
            method_kind: self.parse_method_kind(key)?,
            parameters: params
                .iter()
                .map(|it| self.parse_arrow_parameter(it, parent_span))
                .collect::<Result<Vec<_>>>()?
                .into_iter()
                .flatten()
                .collect(),
            pattern: pattern.clone(),
            summary: endpoint_comments.summary,
            description: endpoint_comments.description,
            return_type: self.convert_to_json_schema(maybe_extract_promise(&ret_ty), parent_span),
        };

        Ok(self.validate_pattern_was_consumed(e))
    }

    fn get_prop_span(prop: &Prop) -> Span {
        match &prop {
            Prop::Shorthand(Ident { span, .. }) => *span,
            Prop::KeyValue(KeyValueProp { key, .. }) => get_prop_name_span(key),
            Prop::Assign(AssignProp { ref key, .. }) => key.span,
            Prop::Getter(GetterProp { span, .. }) => *span,
            Prop::Setter(SetterProp { span, .. }) => *span,
            Prop::Method(MethodProp { key, .. }) => get_prop_name_span(key),
        }
    }

    fn endpoints_from_method_map(
        &mut self,
        prop: &Prop,
        pattern: &ParsedPattern,
    ) -> Vec<FnHandler> {
        if let Prop::KeyValue(KeyValueProp { key, value }) = prop {
            let method_kind = self.parse_method_kind(key);
            if let Ok(MethodKind::Use) = method_kind {
                return vec![FnHandler {
                    pattern: pattern.clone(),
                    summary: None,
                    description: None,
                    parameters: vec![],
                    return_type: JsonSchema::Any,
                    method_kind: MethodKind::Use,
                }];
            }

            if let Expr::Arrow(arr) = &**value {
                match self.method_from_arrow_expr(key, arr, pattern) {
                    Ok(it) => return vec![it],
                    Err(_) => return vec![],
                }
            }

            if let Expr::Fn(func) = &**value {
                match self.method_from_func_expr(key, func, pattern) {
                    Ok(it) => return vec![it],
                    Err(_) => return vec![],
                }
            }
        }
        let span = Self::get_prop_span(prop);
        self.push_error(&span, DiagnosticMessage::NotAnObjectWithMethodKind);

        vec![]
    }

    fn endpoints_from_prop(&mut self, prop: &Prop) -> Vec<FnHandler> {
        if let Prop::KeyValue(KeyValueProp { key, value }) = prop {
            let pattern = self.parse_key(key);
            match pattern {
                Ok(pattern) => {
                    if let Expr::Object(obj) = &**value {
                        return obj
                            .props
                            .iter()
                            .flat_map(|it| match it {
                                PropOrSpread::Spread(it) => {
                                    self.push_error(
                                        &it.dot3_token,
                                        DiagnosticMessage::PropSpreadIsNotSupported,
                                    );

                                    vec![]
                                }
                                PropOrSpread::Prop(it) => {
                                    self.endpoints_from_method_map(it, &pattern)
                                }
                            })
                            .collect();
                    }
                }
                Err(_) => return vec![],
            }
        }

        let span = Self::get_prop_span(prop);
        self.push_error(&span, DiagnosticMessage::NotAnObjectWithMethodKind);

        vec![]
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
                                        tag => self.push_error(
                                            &c.span,
                                            DiagnosticMessage::UnknownJsDocTagOfTypeUnknown(
                                                tag.to_string(),
                                            ),
                                        ),
                                    }
                                }
                                tag => self.push_error(
                                    &c.span,
                                    DiagnosticMessage::UnknownJsDocTag(tag.clone()),
                                ),
                            }
                        }
                    }
                    Err(_) => self.push_error(&c.span, DiagnosticMessage::CannotParseJsDoc),
                }
            }
        }
    }
}

impl<'a, R: FileManager> Visit for ExtractExportDefaultVisitor<'a, R> {
    fn visit_export_default_expr(&mut self, n: &ExportDefaultExpr) {
        match self.get_current_file() {
            Ok(file) => {
                let comments = file.comments.get_leading(n.span.lo);
                if let Some(comments) = comments {
                    self.parse_export_default_comments(comments);
                }
                if let Expr::Object(lit) = &*n.expr {
                    self.found_default_export = true;
                    for prop in &lit.props {
                        match prop {
                            PropOrSpread::Prop(prop) => {
                                let method = self.endpoints_from_prop(prop);
                                self.handlers.extend(method);
                            }
                            PropOrSpread::Spread(SpreadElement { dot3_token, .. }) => {
                                self.push_error(
                                    dot3_token,
                                    DiagnosticMessage::RestOnRouterDefaultExportNotSupportedYet,
                                );
                            }
                        }
                    }
                }
            }
            Err(_) => {}
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

struct EndpointToPath<'a, R: FileManager> {
    files: &'a mut R,
    errors: Vec<Diagnostic>,
    components: &'a Vec<Definition>,
    current_file: &'a str,
}

impl<'a, R: FileManager> EndpointToPath<'a, R> {
    fn push_error(&mut self, span: &Span, msg: DiagnosticMessage) {
        let file = self.files.get_or_fetch_file(&self.current_file);
        match file {
            Some(file) => {
                let (loc_lo, loc_hi) =
                    span_to_loc(span, &file.module.source_map, file.module.fm.end_pos);

                let err = Diagnostic::KnownFile {
                    message: msg,
                    file_name: self.current_file.to_string(),
                    span: *span,
                    loc_lo,
                    loc_hi,
                };
                self.errors.push(err);
            }
            None => {
                let err = Diagnostic::UnknownFile {
                    message: msg,
                    current_file: self.current_file.to_string(),
                };
                self.errors.push(err);
            }
        }
    }

    fn endpoint_to_operation_object(&mut self, endpoint: FnHandler) -> OperationObject {
        let mut parameters: Vec<ParameterObject> = vec![];
        let mut json_request_body: Option<JsonRequestBody> = None;

        if let Some((first_param, rest_param)) = endpoint.parameters.split_first() {
            match first_param.1 {
                HandlerParameter::Context => {}
                _ => {
                    self.push_error(
                        &endpoint.pattern.raw_span,
                        DiagnosticMessage::ContextParameterMustBeFirst,
                    );
                }
            }
            for (_, param) in rest_param {
                match param {
                    HandlerParameter::Context => {
                        self.push_error(
                            &endpoint.pattern.raw_span,
                            DiagnosticMessage::ContextInvalidAtThisPosition,
                        );
                    }
                    _ => {}
                }
            }
        }

        for (key, param) in endpoint.parameters.into_iter() {
            match param {
                HandlerParameter::PathOrQueryOrBody {
                    schema,
                    required,
                    description,
                    span,
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
                            if json_request_body.is_some() {
                                self.push_error(
                                    &span,
                                    DiagnosticMessage::InferringTwoParamsAsRequestBody,
                                );
                            }

                            json_request_body = Some(JsonRequestBody {
                                schema,
                                description,
                                required,
                            });
                        }
                        FunctionParameterIn::InvalidComplexPathParameter => {
                            self.push_error(
                                &endpoint.pattern.raw_span,
                                DiagnosticMessage::ComplexPathParameterNotSupported,
                            );
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
                HandlerParameter::Context => {}
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
        let kind = endpoint.method_kind;
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
    pub entry_file_name: String,
}

fn visit_extract<R: FileManager>(
    files: &mut R,
    current_file: &str,
) -> (Vec<FnHandler>, Vec<Definition>, Vec<Diagnostic>, Info) {
    let mut visitor = ExtractExportDefaultVisitor::new(files, current_file);

    // todo: consume the error?
    let _ = visitor.visit_current_file();

    if !visitor.found_default_export {
        visitor.errors.push(Diagnostic::UnknownFile {
            message: DiagnosticMessage::CouldNotFindDefaultExport,
            current_file: current_file.to_string(),
        })
    }

    (
        visitor.handlers,
        visitor.components,
        visitor.errors,
        visitor.info,
    )
}

pub fn extract_schema<R: FileManager>(files: &mut R, entry_file_name: &str) -> ExtractResult {
    let (handlers, components, errors, info) = visit_extract(files, entry_file_name);

    let mut transformer = EndpointToPath {
        errors: errors,
        components: &components,
        current_file: &entry_file_name,
        files,
    };
    let paths = transformer.endpoints_to_paths(handlers.clone());
    let open_api = OpenApi {
        info: info,
        paths: paths,
        components: components.clone(),
    };

    ExtractResult {
        handlers: handlers,
        open_api,
        errors: transformer.errors,
        components: components,
        entry_file_name: entry_file_name.to_string(),
    }
}
