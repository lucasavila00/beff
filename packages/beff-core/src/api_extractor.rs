use crate::ast::json_schema::JsonSchema;
use crate::diag::{
    Diagnostic, DiagnosticInfoMessage, DiagnosticInformation, DiagnosticParentMessage,
    FullLocation, Location,
};
use crate::open_api_ast::{
    self, ApiPath, HTTPMethod, JsonRequestBody, OpenApi, OperationObject, ParameterIn,
    ParameterObject, ParsedPattern, Validator,
};
use crate::subtyping::semtype::{SemTypeContext, SemTypeOps};
use crate::subtyping::ToSemType;
use crate::sym_reference::{ResolvedLocalSymbol, TypeResolver};
use crate::type_to_schema::TypeToSchema;
use crate::{BeffUserSettings, BffFileName, FileManager, ParsedModule, SymbolExport};
use anyhow::anyhow;
use anyhow::Result;
use core::fmt;
use jsdoc::ast::{SummaryTag, Tag, UnknownTag, VersionTag};
use jsdoc::Input;
use std::collections::HashSet;
use std::rc::Rc;
use swc_common::comments::{Comment, CommentKind, Comments};
use swc_common::{BytePos, Span, Spanned, DUMMY_SP};
use swc_ecma_ast::{
    ArrayPat, ArrowExpr, AssignPat, AssignProp, BigInt, BindingIdent, ComputedPropName, Expr,
    FnExpr, Function, GetterProp, Ident, Invalid, KeyValueProp, Lit, MethodProp, Number, ObjectLit,
    ObjectPat, Pat, Prop, PropName, PropOrSpread, RestPat, SetterProp, SpreadElement, Str, Tpl,
    TsEntityName, TsKeywordType, TsKeywordTypeKind, TsType, TsTypeAnn, TsTypeParamDecl,
    TsTypeParamInstantiation, TsTypeRef,
};

fn maybe_extract_promise(typ: &TsType) -> &TsType {
    if let TsType::TsTypeRef(refs) = typ {
        if let TsEntityName::Ident(i) = &refs.type_name {
            // if name is promise
            if i.sym == *"Promise" {
                if let Some(inst) = refs.type_params.as_ref() {
                    let ts_type = inst.params.get(0);
                    if let Some(ts_type) = ts_type {
                        return ts_type;
                    }
                }
            }
        }
    }
    typ
}

#[derive(Debug, Clone)]
pub enum HandlerParameter {
    PathOrQueryOrBody {
        schema: JsonSchema,
        required: bool,
        description: Option<String>,
        span: Span,
    },
    Header {
        span: Span,
        schema: JsonSchema,
        required: bool,
        description: Option<String>,
    },
    Context(Span),
}

impl HandlerParameter {
    pub fn make_optional(self: HandlerParameter) -> HandlerParameter {
        match self {
            HandlerParameter::PathOrQueryOrBody {
                schema,
                description,
                span,
                ..
            } => HandlerParameter::PathOrQueryOrBody {
                schema,
                required: false,
                description,
                span,
            },
            HandlerParameter::Header {
                span,
                schema,
                description,
                ..
            } => HandlerParameter::Header {
                span,
                schema,
                required: false,
                description,
            },
            HandlerParameter::Context(_) => self,
        }
    }
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum MethodKind {
    Get(Span),
    Post(Span),
    Put(Span),
    Delete(Span),
    Patch(Span),
    Options(Span),
    Use(Span),
}
impl fmt::Display for MethodKind {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            MethodKind::Get(_) => write!(f, "get"),
            MethodKind::Post(_) => write!(f, "post"),
            MethodKind::Put(_) => write!(f, "put"),
            MethodKind::Delete(_) => write!(f, "delete"),
            MethodKind::Patch(_) => write!(f, "patch"),
            MethodKind::Options(_) => write!(f, "options"),
            MethodKind::Use(_) => write!(f, "use"),
        }
    }
}

impl MethodKind {
    pub fn span(&self) -> &Span {
        match self {
            MethodKind::Get(span)
            | MethodKind::Post(span)
            | MethodKind::Put(span)
            | MethodKind::Delete(span)
            | MethodKind::Patch(span)
            | MethodKind::Options(span)
            | MethodKind::Use(span) => span,
        }
    }

    pub fn text_len(&self) -> usize {
        self.to_string().len()
    }
    pub fn to_http_method(&self) -> Option<HTTPMethod> {
        match self {
            MethodKind::Get(_) => Some(HTTPMethod::Get),
            MethodKind::Post(_) => Some(HTTPMethod::Post),
            MethodKind::Put(_) => Some(HTTPMethod::Put),
            MethodKind::Delete(_) => Some(HTTPMethod::Delete),
            MethodKind::Patch(_) => Some(HTTPMethod::Patch),
            MethodKind::Options(_) => Some(HTTPMethod::Options),
            MethodKind::Use(_) => None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct FnHandler {
    pub summary: Option<String>,
    pub description: Option<String>,
    pub parameters: Vec<(String, HandlerParameter)>,
    pub return_type: JsonSchema,
    pub method_kind: MethodKind,
    pub span: Span,
}

struct ExtractExportDefaultVisitor<'a, R: FileManager> {
    files: &'a mut R,
    current_file: BffFileName,
    handlers: Vec<PathHandlerMap>,
    components: Vec<Validator>,
    public_definitions: HashSet<String>,
    errors: Vec<Diagnostic>,
    info: open_api_ast::Info,
    settings: &'a BeffUserSettings,
}
impl<'a, R: FileManager> ExtractExportDefaultVisitor<'a, R> {
    fn new(
        files: &'a mut R,
        current_file: BffFileName,
        settings: &'a BeffUserSettings,
    ) -> ExtractExportDefaultVisitor<'a, R> {
        ExtractExportDefaultVisitor {
            files,
            current_file,
            handlers: vec![],
            components: vec![],
            errors: vec![],
            info: open_api_ast::Info {
                title: None,
                description: None,
                version: None,
            },
            public_definitions: HashSet::new(),
            settings,
        }
    }
    fn parse_endpoints_object(&mut self, lit: &ObjectLit) {
        for prop in &lit.props {
            match prop {
                PropOrSpread::Prop(prop) => {
                    let method = self.endpoints_from_prop(prop);
                    if let Ok(method) = method {
                        self.handlers.push(method)
                    };
                }
                PropOrSpread::Spread(SpreadElement { expr, .. }) => {
                    self.check_expr_for_methods(&expr)
                }
            }
        }
    }
    fn check_ts_export_for_methods(&mut self, expr: &SymbolExport, span: &Span) {
        match expr {
            SymbolExport::StarOfOtherFile(_) => todo!(),
            SymbolExport::ValueExpr { expr, .. } => self.check_expr_for_methods(expr),
            SymbolExport::SomethingOfOtherFile(orig, file_name) => {
                let file = self.files.get_or_fetch_file(file_name);
                let exported = file.and_then(|file| file.symbol_exports.get(orig, self.files));
                if let Some(export) = exported {
                    let old_file = self.current_file.clone();
                    self.current_file = file_name.clone();
                    self.check_ts_export_for_methods(&export, span);
                    self.current_file = old_file;
                } else {
                    self.errors.push(
                        self.build_error(&span, DiagnosticInfoMessage::FoundTypeExpectedValue)
                            .to_diag(None),
                    );
                }
            }
            SymbolExport::TsType { .. } | SymbolExport::TsInterfaceDecl(_) => {
                self.errors.push(
                    self.build_error(&span, DiagnosticInfoMessage::FoundTypeExpectedValue)
                        .to_diag(None),
                );
            }
        }
    }
    fn check_expr_for_methods(&mut self, expr: &Expr) {
        match expr {
            Expr::Object(lit) => {
                self.parse_endpoints_object(lit);
            }
            Expr::Ident(i) => {
                match TypeResolver::new(self.files, &self.current_file).resolve_local_value(i) {
                    Ok(ResolvedLocalSymbol::Expr(expr)) => self.check_expr_for_methods(&expr),
                    Ok(ResolvedLocalSymbol::NamedImport {
                        exported,
                        from_file,
                    }) => {
                        let old_file = self.current_file.clone();
                        self.current_file = from_file.file_name().clone();
                        self.check_ts_export_for_methods(&exported, &expr.span());
                        self.current_file = old_file;
                    }
                    Ok(ResolvedLocalSymbol::SymbolExportDefault(export_default)) => {
                        let old_file = self.current_file.clone();
                        self.current_file = export_default.file_name.clone();
                        self.check_expr_for_methods(&export_default.symbol_export);
                        self.current_file = old_file;
                    }
                    Ok(ResolvedLocalSymbol::TsType { .. })
                    | Ok(ResolvedLocalSymbol::TsInterfaceDecl { .. }) => {
                        self.errors.push(
                            self.build_error(
                                &expr.span(),
                                DiagnosticInfoMessage::FoundTypeExpectedValue,
                            )
                            .to_diag(None),
                        );
                    }
                    Err(e) => self.errors.push(*e),
                }
            }
            _ => {
                self.errors.push(
                    self.build_error(
                        &expr.span(),
                        DiagnosticInfoMessage::CouldNotUnderstandThisPartOfTheRouter,
                    )
                    .to_diag(None),
                );
            }
        }
    }

    fn check_export_default_for_methods(&mut self) {
        let file = self.files.get_or_fetch_file(&self.current_file);
        let expr = file.and_then(|file| file.export_default.clone());
        match expr {
            Some(expr) => {
                if let Ok(file) = self.get_file(&expr.file_name) {
                    let comments = file.comments.get_leading(expr.span.lo);
                    if let Some(comments) = comments {
                        self.parse_export_default_comments(comments);
                    }
                }
                let old_file = self.current_file.clone();
                self.current_file = expr.file_name.clone();
                self.check_expr_for_methods(&expr.symbol_export);
                self.current_file = old_file;
            }
            None => self.errors.push(
                Location::unknown(&self.current_file)
                    .to_info(DiagnosticInfoMessage::CouldNotFindDefaultExport)
                    .to_diag(None),
            ),
        }
    }
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
    *span
}
impl<'a, R: FileManager> ExtractExportDefaultVisitor<'a, R> {
    fn build_error(&self, span: &Span, msg: DiagnosticInfoMessage) -> DiagnosticInformation {
        let file = self.files.get_existing_file(&self.current_file);
        Location::build(file, span, &self.current_file).to_info(msg)
    }
    fn push_error(&mut self, span: &Span, msg: DiagnosticInfoMessage) {
        self.errors.push(self.build_error(span, msg).to_diag(None));
    }

    fn error<T>(&mut self, span: &Span, msg: DiagnosticInfoMessage) -> Result<T> {
        let e = anyhow!("{:?}", &msg);
        self.errors.push(self.build_error(span, msg).to_diag(None));
        Err(e)
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
                        acc.description = Some(parsed.description.value.to_string());
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
                                _tag => self.push_error(
                                    &tag_item.span,
                                    DiagnosticInfoMessage::UnknownJsDocTagOnEndpoint(
                                        tag_item.tag_name.value.to_string(),
                                    ),
                                ),
                            }
                        }
                    }
                    Err(_) => {
                        self.push_error(&c.span, DiagnosticInfoMessage::CannotParseJsDocEndpoint)
                    }
                }
            }
        }
    }
    fn parse_description_comment(
        &mut self,
        comments: Vec<Comment>,
        _span: &Span,
    ) -> Option<String> {
        let comments = comments
            .into_iter()
            .filter(|it| it.kind == CommentKind::Block)
            .collect::<Vec<_>>();

        let first = comments.into_iter().next();
        if let Some(first) = first {
            if first.kind == CommentKind::Block {
                let s = first.text;
                let parsed =
                    jsdoc::parse(Input::new(BytePos(0), BytePos(s.as_bytes().len() as _), &s));
                match parsed {
                    Ok((rest, parsed)) => {
                        if !rest.is_empty() {
                            self.push_error(
                                &first.span,
                                DiagnosticInfoMessage::JsDocDescriptionRestIsNotEmpty,
                            );
                        }
                        if !parsed.tags.is_empty() {
                            self.push_error(
                                &first.span,
                                DiagnosticInfoMessage::JsDocsParameterDescriptionHasTags,
                            );
                        }
                        return Some(parsed.description.value.to_string());
                    }
                    Err(_) => self.push_error(
                        &first.span,
                        DiagnosticInfoMessage::JsDocsDescriptionCouldNotBeParsed,
                    ),
                }
            }
        }
        None
    }

    fn get_full_location(&mut self, span: &Span) -> Result<FullLocation> {
        let file = self.files.get_existing_file(&self.current_file);
        Location::build(file, span, &self.current_file).result_full()
    }

    fn parse_key(&mut self, key: &PropName) -> Result<ParsedPattern> {
        match key {
            PropName::Computed(ComputedPropName { expr, span, .. }) => match &**expr {
                Expr::Lit(Lit::Str(Str { span, value, .. })) => {
                    let locs = self.get_full_location(span)?;
                    let p = ApiPath::parse_raw_pattern_str(value.as_ref(), Some(locs.clone()));
                    match p {
                        Ok(v) => Ok(v),
                        Err(e) => {
                            self.errors.push(locs.to_diag(e));
                            Err(anyhow!("failed to parse pattern"))
                        }
                    }
                }
                Expr::Tpl(Tpl {
                    span,
                    exprs,
                    quasis,
                }) => {
                    if !exprs.is_empty() {
                        return self
                            .error(span, DiagnosticInfoMessage::TemplateMustBeOfSingleString);
                    }
                    if quasis.len() != 1 {
                        return self
                            .error(span, DiagnosticInfoMessage::TemplateMustBeOfSingleString);
                    }
                    let first_quasis = quasis.first().expect("we just checked the length");
                    let locs = self.get_full_location(span)?;
                    let p = ApiPath::parse_raw_pattern_str(
                        first_quasis.raw.as_ref(),
                        Some(locs.clone()),
                    );
                    match p {
                        Ok(v) => Ok(v),
                        Err(e) => {
                            self.errors.push(locs.to_diag(e));
                            Err(anyhow!("failed to parse pattern"))
                        }
                    }
                }
                _ => self.error(
                    span,
                    DiagnosticInfoMessage::MustBeComputedKeyWithMethodAndPatternMustBeString,
                ),
            },
            PropName::Ident(Ident {
                span, sym: value, ..
            })
            | PropName::Str(Str { span, value, .. }) => {
                let locs = self.get_full_location(span)?;
                let p = ApiPath::parse_raw_pattern_str(&value.to_string(), Some(locs.clone()));
                match p {
                    Ok(v) => Ok(v),
                    Err(e) => {
                        self.errors.push(locs.to_diag(e));
                        Err(anyhow!("failed to parse pattern"))
                    }
                }
            }

            PropName::Num(Number { span, .. }) | PropName::BigInt(BigInt { span, .. }) => self
                .error(
                    span,
                    DiagnosticInfoMessage::PatternMustBeComputedKeyOrString,
                ),
        }
    }

    fn extend_components(&mut self, defs: Vec<Validator>, span: &Span) {
        for d in defs {
            let found = self.components.iter_mut().find(|x| x.name == d.name);
            if let Some(found) = found {
                if found.schema != d.schema {
                    self.push_error(
                        span,
                        DiagnosticInfoMessage::TwoDifferentTypesWithTheSameName,
                    );
                }
            } else {
                self.components.push(d);
            }
        }
    }

    fn validate_type_is_not_empty(&mut self, ty: &JsonSchema, span: &Span) {
        let mut ctx = SemTypeContext::new();
        let validators = &self.components.iter().collect::<Vec<_>>();
        let st = ty.to_sub_type(validators, &mut ctx);

        match st {
            Ok(st) => {
                if st.is_empty(&mut ctx) {
                    self.push_error(span, DiagnosticInfoMessage::TypeMustNotBeEmpty);
                }
            }
            Err(e) => {
                self.push_error(
                    span,
                    DiagnosticInfoMessage::CannotConvertToSubtype(format!("{:?}", e)),
                );
            }
        }
    }

    fn convert_to_json_schema(&mut self, ty: &TsType) -> JsonSchema {
        let mut to_schema = TypeToSchema::new(self.files, self.current_file.clone(), self.settings);
        let res = to_schema.convert_ts_type(ty);
        let span = ty.span();
        match res {
            Ok(res) => {
                let mut kvs = vec![];
                for (k, v) in to_schema.components {
                    // We store type in an Option to support self-recursion.
                    // When we encounter the type while transforming it we return string with the type name.
                    // And we need the option to allow a type to refer to itself before it has been resolved.
                    match v {
                        Some(s) => {
                            self.public_definitions.insert(k.clone());

                            kvs.push((k, s))
                        }
                        None => self.push_error(
                            &span,
                            DiagnosticInfoMessage::CannotResolveTypeReferenceOnExtracting(k),
                        ),
                    }
                }

                kvs.sort_by(|(ka, _), (kb, _)| ka.cmp(kb));
                let ext: Vec<Validator> = kvs.into_iter().map(|(_k, v)| v).collect();
                self.extend_components(ext, &span);

                self.validate_type_is_not_empty(&res, &span);

                res
            }
            Err(diag) => {
                self.errors.push(*diag);
                JsonSchema::Any
            }
        }
    }
    fn parse_header_param(
        &mut self,
        lib_ty_name: &Ident,
        params: &Option<Box<TsTypeParamInstantiation>>,
        required: bool,
        description: Option<String>,
    ) -> Result<HandlerParameter> {
        let params = &params.as_ref().and_then(|it| it.params.split_first());
        match params {
            Some((ty, [])) => Ok(HandlerParameter::Header {
                span: lib_ty_name.span,
                schema: self.convert_to_json_schema(ty),
                required,
                description,
            }),
            _ => self.error(
                &lib_ty_name.span,
                DiagnosticInfoMessage::TooManyParamsOnLibType,
            ),
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
                return Ok(HandlerParameter::Context(i.span));
            }
            if name == "Header" {
                return self.parse_header_param(i, &tref.type_params, required, description);
            }
        }
        Ok(HandlerParameter::PathOrQueryOrBody {
            schema: self.convert_to_json_schema(ty),
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
                schema: self.convert_to_json_schema(ty),
                required,
                description,
                span: *span,
            }),
        }
    }

    fn get_file(&mut self, name: &BffFileName) -> Result<Rc<ParsedModule>> {
        match self.files.get_or_fetch_file(&name) {
            Some(it) => Ok(it),
            None => {
                self.errors.push(
                    self.build_error(
                        &DUMMY_SP,
                        DiagnosticInfoMessage::CannotFindFileWhenConvertingToSchema(
                            self.current_file.clone(),
                        ),
                    )
                    .to_diag(None),
                );
                Err(anyhow!("cannot find file: {}", self.current_file.0))
            }
        }
    }
    fn get_current_file(&mut self) -> Result<Rc<ParsedModule>> {
        self.get_file(&self.current_file.clone())
    }

    fn parse_arrow_parameter(
        &mut self,
        param: &Pat,
        parent_span: &Span,
    ) -> Result<(String, HandlerParameter)> {
        match param {
            Pat::Ident(BindingIdent { id, type_ann }) => {
                if type_ann.is_none() {
                    return self.error(
                        &id.span,
                        DiagnosticInfoMessage::ParameterIdentMustHaveTypeAnnotation,
                    );
                }

                let comments = self.get_current_file()?.comments.get_leading(id.span.lo);
                let description =
                    comments.and_then(|it| self.parse_description_comment(it, &id.span));
                let ty = self.assert_and_extract_type_from_ann(type_ann, &id.span);
                let param = self.parse_parameter_type(&ty, !id.optional, description, &id.span)?;
                Ok((id.sym.to_string(), param))
            }
            Pat::Assign(AssignPat { span, left, .. }) => {
                let (name, ty) = self.parse_arrow_parameter(left, span)?;
                Ok((name, ty.make_optional()))
            }
            Pat::Rest(RestPat { span, .. })
            | Pat::Array(ArrayPat { span, .. })
            | Pat::Object(ObjectPat { span, .. })
            | Pat::Invalid(Invalid { span, .. }) => {
                self.error(span, DiagnosticInfoMessage::ParameterPatternNotSupported)
            }
            Pat::Expr(_) => self.error(
                parent_span,
                DiagnosticInfoMessage::ParameterPatternNotSupported,
            ),
        }
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
            return self.error(span, DiagnosticInfoMessage::HandlerCannotBeGenerator);
        }
        if type_params.is_some() {
            return self.error(span, DiagnosticInfoMessage::HandlerCannotHaveTypeParameters);
        }

        Ok(())
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
        self.validate_handler_func(*is_generator, type_params, parent_span)?;

        let endpoint_comments = self.get_endpoint_comments(key)?;

        let return_type = self.assert_and_extract_type_from_ann(return_type, parent_span);
        let parameters = params
            .iter()
            .map(|it| self.parse_arrow_parameter(&it.pat, parent_span))
            .collect::<Result<Vec<_>>>()?;
        let e = FnHandler {
            method_kind: self.parse_method_kind(key)?,
            parameters,
            summary: endpoint_comments.summary,
            description: endpoint_comments.description,
            return_type: self.convert_to_json_schema(maybe_extract_promise(&return_type)),
            span: *parent_span,
        };

        Ok(e)
    }

    fn assert_and_extract_type_from_ann(
        &mut self,
        return_type: &Option<Box<TsTypeAnn>>,
        span: &Span,
    ) -> TsType {
        match return_type.as_ref() {
            Some(t) => (*t.type_ann).clone(),
            None => {
                self.push_error(span, DiagnosticInfoMessage::ReturnAnnotationIsRequired);
                TsType::TsKeywordType(TsKeywordType {
                    span: DUMMY_SP,
                    kind: TsKeywordTypeKind::TsAnyKeyword,
                })
            }
        }
    }

    fn parse_method_kind(&mut self, key: &PropName) -> Result<MethodKind> {
        match key {
            PropName::Str(Str {
                span, value: sym, ..
            })
            | PropName::Ident(Ident { sym, span, .. }) => match sym.to_string().as_str() {
                "get" => Ok(MethodKind::Get(span.clone())),
                "post" => Ok(MethodKind::Post(span.clone())),
                "put" => Ok(MethodKind::Put(span.clone())),
                "delete" => Ok(MethodKind::Delete(span.clone())),
                "patch" => Ok(MethodKind::Patch(span.clone())),
                "options" => Ok(MethodKind::Options(span.clone())),
                "use" => Ok(MethodKind::Use(span.clone())),
                _ => self.error(span, DiagnosticInfoMessage::NotAnHttpMethod),
            },

            _ => {
                let span = get_prop_name_span(key);
                self.error(&span, DiagnosticInfoMessage::NotAnHttpMethod)
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
                .collect(),
            summary: endpoint_comments.summary,
            description: endpoint_comments.description,
            return_type: self.convert_to_json_schema(maybe_extract_promise(&ret_ty)),
            span: *parent_span,
        };

        Ok(e)
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

    fn endpoints_from_method_map(&mut self, prop: &Prop) -> Vec<FnHandler> {
        if let Prop::KeyValue(KeyValueProp { key, value }) = prop {
            let method_kind = self.parse_method_kind(key);
            if let Ok(MethodKind::Use(span)) = method_kind {
                return vec![FnHandler {
                    summary: None,
                    description: None,
                    parameters: vec![],
                    return_type: JsonSchema::Any,
                    method_kind: MethodKind::Use(span.clone()),
                    span: Self::get_prop_span(prop),
                }];
            }

            if let Expr::Arrow(arr) = &**value {
                match self.method_from_arrow_expr(key, arr) {
                    Ok(it) => return vec![it],
                    Err(_) => return vec![],
                }
            }

            if let Expr::Fn(func) = &**value {
                match self.method_from_func_expr(key, func) {
                    Ok(it) => return vec![it],
                    Err(_) => return vec![],
                }
            }
        }
        let span = Self::get_prop_span(prop);
        self.push_error(&span, DiagnosticInfoMessage::NotAnObjectWithMethodKind);

        vec![]
    }

    fn endpoints_from_prop(&mut self, prop: &Prop) -> Result<PathHandlerMap> {
        if let Prop::KeyValue(KeyValueProp { key, value }) = prop {
            let pattern = self.parse_key(key)?;
            if let Expr::Object(obj) = &**value {
                let handlers = obj
                    .props
                    .iter()
                    .flat_map(|it| match it {
                        PropOrSpread::Spread(it) => {
                            self.push_error(
                                &it.dot3_token,
                                DiagnosticInfoMessage::PropSpreadIsNotSupportedOnMethodMap,
                            );

                            vec![]
                        }
                        PropOrSpread::Prop(prop) => self.endpoints_from_method_map(prop),
                    })
                    .collect();

                return Ok(PathHandlerMap {
                    pattern,
                    handlers,
                    loc: self.get_full_location(&Self::get_prop_span(prop))?,
                });
            }
        }

        let span = Self::get_prop_span(prop);
        self.push_error(&span, DiagnosticInfoMessage::NotAnObjectWithMethodKind);

        Err(anyhow!("not an object"))
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
                        self.info.description = Some(parsed.description.value.to_string());
                        if rest.len() > 0 {
                            self.info.description = Some(format!(
                                "{}\n{}",
                                self.info.description.as_ref().unwrap_or(&String::new()),
                                rest.to_string()
                            ));
                        }
                        for tag_item in parsed.tags {
                            match tag_item.tag {
                                Tag::Version(VersionTag { value, .. }) => {
                                    self.info.version = Some(value.value.to_string());
                                }
                                Tag::Unknown(UnknownTag { extras, .. }) => {
                                    match &*tag_item.tag_name.value {
                                        "title" => {
                                            self.info.title = Some(extras.value.to_string());
                                        }
                                        tag => self.push_error(
                                            &c.span,
                                            DiagnosticInfoMessage::UnknownJsDocTagOfTypeUnknown(
                                                tag.to_string(),
                                            ),
                                        ),
                                    }
                                }
                                _v => self.push_error(
                                    &c.span,
                                    DiagnosticInfoMessage::UnknownJsDocTagOnRouter(
                                        tag_item.tag_name.value.to_string(),
                                    ),
                                ),
                            }
                        }
                    }
                    Err(_) => self.push_error(
                        &c.span,
                        DiagnosticInfoMessage::CannotParseJsDocExportDefault,
                    ),
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

/// is_type_simple returns true if the type is simple enough to be used as a query parameter
fn is_type_simple(it: &JsonSchema, components: &Vec<Validator>) -> bool {
    match it {
        JsonSchema::OpenApiResponseRef(r) | JsonSchema::Ref(r) => {
            let def = components
                .iter()
                .find(|it| &it.name == r)
                .expect("can always find ref in json schema at this point");
            is_type_simple(&def.schema, components)
        }
        JsonSchema::AllOf(vs) | JsonSchema::AnyOf(vs) => {
            vs.iter().all(|it| is_type_simple(it, components))
        }
        JsonSchema::Codec(_)
        | JsonSchema::Null
        | JsonSchema::Boolean
        | JsonSchema::String
        | JsonSchema::Number
        | JsonSchema::StringWithFormat(_)
        | JsonSchema::Const(_) => true,
        JsonSchema::Any
        | JsonSchema::Object { .. }
        | JsonSchema::Array(_)
        | JsonSchema::AnyObject
        | JsonSchema::AnyArrayLike
        | JsonSchema::Tuple { .. } => false,
        JsonSchema::StNever | JsonSchema::StUnknown | JsonSchema::StNot(_) => {
            // is_type_simple should be used just to infer what is the type of a parameter
            // semantic types are only created after inference
            unreachable!("Semantic types should not be checked for simplicity")
        }
    }
}

pub fn operation_parameter_in_path_or_query_or_body(
    name: &str,
    pattern: &ParsedPattern,
    schema: &JsonSchema,
    components: &Vec<Validator>,
) -> FunctionParameterIn {
    // if name is in pattern return path
    if pattern.path_params.contains(&name.to_string()) {
        if is_type_simple(schema, components) {
            FunctionParameterIn::Path
        } else {
            FunctionParameterIn::InvalidComplexPathParameter
        }
    } else if is_type_simple(schema, components) {
        FunctionParameterIn::Query
    } else {
        FunctionParameterIn::Body
    }
}

struct EndpointToPath<'a, R: FileManager> {
    files: &'a mut R,
    errors: Vec<Diagnostic>,
    components: &'a Vec<Validator>,
    current_file: BffFileName,
}

impl<'a, R: FileManager> EndpointToPath<'a, R> {
    fn push_error(
        &mut self,
        span: &Span,
        info_msg: DiagnosticInfoMessage,
        parent_msg: Option<DiagnosticParentMessage>,
    ) {
        let file = self.files.get_or_fetch_file(&self.current_file);
        let err = Location::build(file, span, &self.current_file).to_info(info_msg);
        self.errors.push(err.to_diag(parent_msg));
    }

    fn endpoint_to_operation_object(
        &mut self,
        endpoint: &FnHandler,
        pattern: &ParsedPattern,
    ) -> Result<OperationObject> {
        let mut parameters: Vec<ParameterObject> = vec![];
        let mut json_request_body: Option<JsonRequestBody> = None;

        if let Some((first_param, rest_param)) = endpoint.parameters.split_first() {
            match first_param.1 {
                HandlerParameter::Context(_) => {}
                HandlerParameter::PathOrQueryOrBody { span, .. }
                | HandlerParameter::Header { span, .. } => {
                    self.push_error(
                        &span,
                        DiagnosticInfoMessage::ContextParameterMustBeFirst,
                        Some(DiagnosticParentMessage::InvalidContextPosition),
                    );
                }
            }
            for (_, param) in rest_param {
                if let HandlerParameter::Context(span) = param {
                    self.push_error(
                        span,
                        DiagnosticInfoMessage::ContextInvalidAtThisPosition,
                        Some(DiagnosticParentMessage::InvalidContextPosition),
                    );
                }
            }
        }

        for (key, param) in endpoint.parameters.iter() {
            match param {
                HandlerParameter::PathOrQueryOrBody {
                    schema,
                    required,
                    description,
                    span,
                    ..
                } => {
                    match operation_parameter_in_path_or_query_or_body(
                        key,
                        pattern,
                        &schema,
                        self.components,
                    ) {
                        FunctionParameterIn::Path => parameters.push(ParameterObject {
                            in_: ParameterIn::Path,
                            name: key.clone(),
                            required: *required,
                            description: description.clone(),
                            schema: schema.clone(),
                        }),
                        FunctionParameterIn::Query => parameters.push(ParameterObject {
                            in_: ParameterIn::Query,
                            name: key.clone(),
                            required: *required,
                            description: description.clone(),
                            schema: schema.clone(),
                        }),
                        FunctionParameterIn::Body => {
                            if json_request_body.is_some() {
                                self.push_error(
                                    span,
                                    DiagnosticInfoMessage::InferringTwoParamsAsRequestBody,
                                    None,
                                );
                            }

                            json_request_body = Some(JsonRequestBody {
                                schema: schema.clone(),
                                description: description.clone(),
                                required: *required,
                            });
                        }
                        FunctionParameterIn::InvalidComplexPathParameter => {
                            self.push_error(
                                span,
                                DiagnosticInfoMessage::ComplexPathParameterNotSupported,
                                Some(DiagnosticParentMessage::ComplexPathParam),
                            );
                        }
                    }
                }
                HandlerParameter::Header {
                    required,
                    description,
                    schema,
                    ..
                } => parameters.push(ParameterObject {
                    in_: ParameterIn::Header,
                    name: key.clone(),
                    required: *required,
                    description: description.clone(),
                    schema: schema.clone(),
                }),
                HandlerParameter::Context(_) => {}
            };
        }

        Ok(OperationObject {
            summary: endpoint.summary.clone(),
            description: endpoint.description.clone(),
            parameters,
            json_response_body: endpoint.return_type.clone(),
            json_request_body,
        })
    }

    fn endpoints_to_paths(&mut self, endpoints: &[PathHandlerMap]) -> Vec<open_api_ast::ApiPath> {
        endpoints
            .iter()
            .map(|handler_map| {
                let contains_star = handler_map.pattern.raw.contains('*');
                if contains_star {
                    for endpoint in &handler_map.handlers {
                        match endpoint.method_kind {
                            MethodKind::Use(_) => {}
                            MethodKind::Get(span)
                            | MethodKind::Post(span)
                            | MethodKind::Put(span)
                            | MethodKind::Patch(span)
                            | MethodKind::Delete(span)
                            | MethodKind::Options(span) => {
                                self.push_error(
                                    &span,
                                    DiagnosticInfoMessage::StarPatternMustBeUsedWithUse,
                                    None,
                                );
                            }
                        }
                    }
                }

                let mut path = open_api_ast::ApiPath::from_pattern(handler_map.pattern.clone());
                for endpoint in &handler_map.handlers {
                    if let Some(m) = endpoint.method_kind.to_http_method() {
                        let op = self.endpoint_to_operation_object(endpoint, &handler_map.pattern);
                        if let Ok(op) = op {
                            path.methods.insert(m, op);
                        }
                    }
                }
                self.errors.extend(path.validate(&handler_map.loc));
                path
            })
            .collect()
    }
}

#[derive(Clone)]
pub struct PathHandlerMap {
    pub loc: FullLocation,
    pub pattern: ParsedPattern,
    pub handlers: Vec<FnHandler>,
}

pub struct RouterExtractResult {
    pub errors: Vec<Diagnostic>,
    pub open_api: OpenApi,
    pub entry_file_name: BffFileName,
    pub routes: Vec<PathHandlerMap>,
    pub validators: Vec<Validator>,
}

pub fn extract_schema<R: FileManager>(
    files: &mut R,
    entry_file_name: BffFileName,
    settings: &BeffUserSettings,
) -> RouterExtractResult {
    let (handlers, components, errors, info, public_definitions) = {
        let mut visitor =
            ExtractExportDefaultVisitor::new(files, entry_file_name.clone(), settings);
        visitor.check_export_default_for_methods();
        (
            visitor.handlers,
            visitor.components,
            visitor.errors,
            visitor.info,
            visitor.public_definitions,
        )
    };

    let mut transformer = EndpointToPath {
        errors: errors,
        components: &components,
        current_file: entry_file_name.clone(),
        files,
    };
    let paths = transformer.endpoints_to_paths(&handlers);
    let errors = transformer.errors;
    let open_api = OpenApi {
        info: info,
        components: public_definitions.into_iter().collect(),
        paths,
    };

    // TODO: validate that all intersections are valid (no empty types anywhere)

    RouterExtractResult {
        routes: handlers,
        open_api,
        entry_file_name,
        errors,
        validators: components,
    }
}
