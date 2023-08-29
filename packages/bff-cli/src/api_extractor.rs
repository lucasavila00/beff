use crate::type_to_schema::TypeToSchema;
use crate::ParsedModule;
use anyhow::anyhow;
use anyhow::Result;
use bff_core::diag::{Diagnostic, DiagnosticMessage};
use bff_core::open_api_ast::{
    self, Definition, JsonRequestBody, JsonSchema, OpenApi, OperationObject, ParameterIn,
    ParameterObject,
};
use core::fmt;
use jsdoc::ast::{SummaryTag, Tag, UnknownTag, VersionTag};
use jsdoc::Input;
use swc_common::comments::{Comment, CommentKind, Comments};
use swc_common::{collections::AHashMap, FileName};
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

impl<'a> ExtractExportDefaultVisitor<'a> {
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
                                tag => self.errors.push(Diagnostic {
                                    message: DiagnosticMessage::UnknownJsDocTag(tag.clone()),
                                    file_name: self.current_file.module.fm.name.clone(),
                                    span: tag_item.span,
                                }),
                            }
                        }
                    }
                    Err(_) => self.errors.push(Diagnostic {
                        message: DiagnosticMessage::CannotParseJsDoc,
                        file_name: self.current_file.module.fm.name.clone(),
                        span: c.span,
                    }),
                }
            }
        }
    }
    fn parse_description_comment(&mut self, comments: Vec<Comment>, span: &Span) -> Option<String> {
        if comments.len() != 1 {
            self.errors.push(Diagnostic {
                message: DiagnosticMessage::CannotParseJsDoc,
                file_name: self.current_file.module.fm.name.clone(),
                span: *span,
            });
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
                        self.errors.push(Diagnostic {
                            message: DiagnosticMessage::CannotParseJsDoc,
                            file_name: self.current_file.module.fm.name.clone(),
                            span: first.span,
                        });
                    }
                    if !parsed.tags.is_empty() {
                        for tag in parsed.tags {
                            self.errors.push(Diagnostic {
                                message: DiagnosticMessage::UnknownJsDocTagItem(tag.clone()),
                                file_name: self.current_file.module.fm.name.clone(),
                                span: tag.span,
                            })
                        }
                    }
                    return Some(trim_description_comments(
                        parsed.description.value.to_string(),
                    ));
                }
                Err(_) => self.errors.push(Diagnostic {
                    message: DiagnosticMessage::CannotParseJsDoc,
                    file_name: self.current_file.module.fm.name.clone(),
                    span: first.span,
                }),
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
                        self.errors.push(Diagnostic {
                            message: DiagnosticMessage::TemplateMustBeOfSingleString,
                            file_name: self.current_file.module.fm.name.clone(),
                            span: *span,
                        });
                        return Err(anyhow!("not single string"));
                    }
                    if quasis.len() != 1 {
                        self.errors.push(Diagnostic {
                            message: DiagnosticMessage::TemplateMustBeOfSingleString,
                            file_name: self.current_file.module.fm.name.clone(),
                            span: *span,
                        });
                        return Err(anyhow!("not single string"));
                    }
                    let first_quasis = quasis.first().expect("we just checked the length");
                    self.parse_raw_pattern_str(&first_quasis.raw.to_string(), span)
                }
                _ => {
                    self.errors.push(Diagnostic {
                        message:
                            DiagnosticMessage::MustBeComputedKeyWithMethodAndPatternMustBeString,
                        file_name: self.current_file.module.fm.name.clone(),
                        span: *span,
                    });
                    Err(anyhow!("not computed key"))
                }
            },
            PropName::Ident(Ident { span, .. })
            | PropName::Str(Str { span, .. })
            | PropName::Num(Number { span, .. })
            | PropName::BigInt(BigInt { span, .. }) => {
                self.errors.push(Diagnostic {
                    message: DiagnosticMessage::MustBeComputedKey,
                    file_name: self.current_file.module.fm.name.clone(),
                    span: *span,
                });
                Err(anyhow!("not computed key"))
            }
        }
    }

    fn extend_components(&mut self, defs: Vec<Definition>, span: &Span) {
        for d in defs {
            let found = self.components.iter_mut().find(|x| x.name == d.name);
            if let Some(found) = found {
                if found.schema != d.schema {
                    self.errors.push(Diagnostic {
                        message: DiagnosticMessage::TwoDifferentTypesWithTheSameName,
                        file_name: self.current_file.module.fm.name.clone(),
                        span: *span,
                    });
                }
            } else {
                self.components.push(d);
            }
        }
    }

    fn convert_to_json_schema(&mut self, ty: &TsType, span: &Span) -> JsonSchema {
        let mut to_schema = TypeToSchema::new(self.files, self.current_file);
        let res = to_schema.convert_ts_type(ty);

        let mut kvs = vec![];
        for (k, v) in to_schema.components {
            // We store type in an Option to support self-recursion.
            // When we encounter the type while transforming it we return string with the type name.
            // And we need the option to allow a type to refer to itself before it has been resolved.
            match v {
                Some(s) => kvs.push((k, s)),
                None => self.errors.push(Diagnostic {
                    message: DiagnosticMessage::CannotResolveTypeReferenceOnExtracting(k),
                    file_name: self.current_file.module.fm.name.clone(),
                    span: *span,
                }),
            }
        }
        kvs.sort_by(|(ka, _), (kb, _)| ka.cmp(kb));
        let ext = kvs.into_iter().map(|(_k, v)| v).collect();
        self.extend_components(ext, span);
        self.errors.extend(to_schema.errors);
        res
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
                        self.errors.push(Diagnostic {
                            message: DiagnosticMessage::TooManyParamsOnLibType,
                            file_name: self.current_file.module.fm.name.clone(),
                            span: lib_ty_name.span,
                        });
                        return Err(anyhow!("Header/Cookie must have one type parameter"));
                    }
                    Some(params) => {
                        let params = &params.params;
                        if params.len() != 1 {
                            self.errors.push(Diagnostic {
                                message: DiagnosticMessage::TooManyParamsOnLibType,
                                file_name: self.current_file.module.fm.name.clone(),
                                span: lib_ty_name.span,
                            });
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

                        match alias_opt {
                            Some(it) => it,
                            None => self.error_param(
                                rest_span,
                                DiagnosticMessage::CouldNotResolveIdentifierOnPathParamTuple,
                            ),
                        }
                    }
                }
            }
            TsType::TsTupleType(TsTupleType { elem_types, .. }) => elem_types
                .iter()
                .flat_map(|it| match &it.label {
                    Some(pat) => match pat {
                        Pat::Ident(BindingIdent { id, .. }) => {
                            let comments = self.current_file.comments.get_leading(id.span.lo);
                            let description = comments
                                .and_then(|it| self.parse_description_comment(it, &id.span));
                            let param = self.parse_parameter_type(
                                &it.ty,
                                !id.optional,
                                description,
                                &id.span,
                            );
                            match param {
                                Ok(param) => vec![(id.sym.to_string(), param)],
                                Err(_) => vec![],
                            }
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
                if type_ann.is_none() {
                    self.errors.push(Diagnostic {
                        message: DiagnosticMessage::ParameterIdentMustHaveTypeAnnotation,
                        file_name: self.current_file.module.fm.name.clone(),
                        span: id.span,
                    });
                    return vec![];
                }

                let comments = self.current_file.comments.get_leading(id.span.lo);
                let description =
                    comments.and_then(|it| self.parse_description_comment(it, &id.span));
                let ty = self.assert_and_extract_type_from_ann(type_ann, &id.span);
                let param = self.parse_parameter_type(&ty, !id.optional, description, &id.span);
                match param {
                    Ok(param) => vec![(id.sym.to_string(), param)],
                    Err(_) => vec![],
                }
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

    fn get_endpoint_comments(&mut self, key: &PropName) -> EndpointComments {
        let comments = self
            .current_file
            .comments
            .get_leading(Self::get_prop_name_span(key).lo);

        let mut endpoint_comments = EndpointComments {
            summary: None,
            description: None,
        };
        if let Some(comments) = comments {
            self.parse_endpoint_comments(&mut endpoint_comments, comments);
        }
        endpoint_comments
    }
    fn validate_handler_func(
        &mut self,
        is_generator: bool,
        type_params: &Option<Box<TsTypeParamDecl>>,
        span: &Span,
    ) -> Result<()> {
        if is_generator {
            self.errors.push(Diagnostic {
                message: DiagnosticMessage::HandlerCannotBeGenerator,
                file_name: self.current_file.module.fm.name.clone(),
                span: *span,
            });
            return Err(anyhow!("cannot be generator"));
        }
        if type_params.is_some() {
            self.errors.push(Diagnostic {
                message: DiagnosticMessage::HandlerCannotHaveTypeParameters,
                file_name: self.current_file.module.fm.name.clone(),
                span: *span,
            });
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

        let endpoint_comments = self.get_endpoint_comments(key);

        let return_type = self.assert_and_extract_type_from_ann(return_type, parent_span);
        let e = FnHandler {
            method_kind: Self::parse_method_kind(key),
            parameters: params
                .iter()
                .flat_map(|it| self.parse_arrow_parameter(&it.pat, parent_span))
                .collect(),
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

    fn parse_method_kind(key: &PropName) -> MethodKind {
        match key {
            PropName::Ident(Ident { sym, .. }) => match sym.to_string().as_str() {
                "get" => MethodKind::Get,
                "post" => MethodKind::Post,
                "put" => MethodKind::Put,
                "delete" => MethodKind::Delete,
                "patch" => MethodKind::Patch,
                "options" => MethodKind::Options,
                "use" => MethodKind::Use,
                _ => todo!(),
            },
            PropName::Str(_) => todo!(),
            PropName::Num(_) => todo!(),
            PropName::Computed(_) => todo!(),
            PropName::BigInt(_) => todo!(),
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

        let endpoint_comments = self.get_endpoint_comments(key);

        let ret_ty = self.assert_and_extract_type_from_ann(return_type, parent_span);
        let e = FnHandler {
            method_kind: Self::parse_method_kind(key),
            parameters: params
                .iter()
                .flat_map(|it| self.parse_arrow_parameter(it, parent_span))
                .collect(),
            pattern: pattern.clone(),
            summary: endpoint_comments.summary,
            description: endpoint_comments.description,
            return_type: self.convert_to_json_schema(maybe_extract_promise(&ret_ty), parent_span),
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

    fn endpoints_from_method_map(
        &mut self,
        prop: &Prop,
        pattern: &ParsedPattern,
    ) -> Vec<FnHandler> {
        if let Prop::KeyValue(KeyValueProp { key, value }) = prop {
            let method_kind = Self::parse_method_kind(key);
            if method_kind == MethodKind::Use {
                return vec![FnHandler {
                    pattern: pattern.clone(),
                    summary: None,
                    description: None,
                    parameters: vec![],
                    return_type: JsonSchema::Any,
                    method_kind,
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
        self.errors.push(Diagnostic {
            message: DiagnosticMessage::NotAnObjectWithMethodKind,
            file_name: self.current_file.module.fm.name.clone(),
            span,
        });
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
                                PropOrSpread::Spread(_) => todo!(),
                                PropOrSpread::Prop(it) => {
                                    self.endpoints_from_method_map(it, &pattern)
                                }
                            })
                            .collect();
                    }
                }
                Err(_) => todo!(),
            }
        }

        let span = Self::get_prop_span(prop);
        self.errors.push(Diagnostic {
            message: DiagnosticMessage::NotAnObjectWithMethodKind,
            file_name: self.current_file.module.fm.name.clone(),
            span,
        });
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
                                        tag => self.errors.push(Diagnostic {
                                            message:
                                                DiagnosticMessage::UnknownJsDocTagOfTypeUnknown(
                                                    tag.to_string(),
                                                ),
                                            file_name: self.current_file.module.fm.name.clone(),
                                            span: c.span,
                                        }),
                                    }
                                }
                                tag => self.errors.push(Diagnostic {
                                    message: DiagnosticMessage::UnknownJsDocTag(tag.clone()),
                                    file_name: self.current_file.module.fm.name.clone(),
                                    span: c.span,
                                }),
                            }
                        }
                    }
                    Err(_) => self.errors.push(Diagnostic {
                        message: DiagnosticMessage::CannotParseJsDoc,
                        file_name: self.current_file.module.fm.name.clone(),
                        span: c.span,
                    }),
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
                        let method = self.endpoints_from_prop(prop);
                        self.handlers.extend(method);
                    }
                    PropOrSpread::Spread(SpreadElement { dot3_token, .. }) => {
                        self.errors.push(Diagnostic {
                            message: DiagnosticMessage::RestOnRouterDefaultExportNotSupportedYet,
                            file_name: self.current_file.module.fm.name.clone(),
                            span: *dot3_token,
                        });
                    }
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
                                self.errors.push(Diagnostic {
                                    message: DiagnosticMessage::InferringTwoParamsAsRequestBody,
                                    file_name: self.current_file.clone(),
                                    span: span,
                                });
                            }

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
