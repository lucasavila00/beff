use std::rc::Rc;

use swc_common::Span;
use swc_ecma_ast::{
    Expr, Ident, TsCallSignatureDecl, TsConstructSignatureDecl, TsEntityName, TsEnumDecl,
    TsGetterSignature, TsIndexSignature, TsInterfaceDecl, TsKeywordType, TsKeywordTypeKind,
    TsMethodSignature, TsPropertySignature, TsQualifiedName, TsSetterSignature, TsType,
    TsTypeElement, TsTypeLit, TsTypeParamDecl, TsTypeParamInstantiation, TsTypeRef,
};

use crate::{
    ast::runtype::Runtype,
    diag::{Diagnostic, DiagnosticInfoMessage, DiagnosticInformation, Location},
    parser_extractor::BuiltDecoder,
    BeffUserSettings, BffFileName, FileManager, ImportReference, ModuleItemAddress, TsNamespace,
    Visibility,
};
use anyhow::{anyhow, Result};
pub struct FrontendCtx<'a, R: FileManager> {
    pub files: &'a mut R,
    pub settings: &'a BeffUserSettings,

    pub parser_file: BffFileName,
    pub errors: Vec<Diagnostic>,
}

pub enum AddressedType {
    TsType(Option<Rc<TsTypeParamDecl>>, Rc<TsType>),
    TsInterfaceDecl(Rc<TsInterfaceDecl>),
    TsEnumDecl(Rc<TsEnumDecl>),
}

type Res<T> = Result<T, Box<Diagnostic>>;

impl<'a, R: FileManager> FrontendCtx<'a, R> {
    pub fn new(files: &'a mut R, parser_file: BffFileName, settings: &'a BeffUserSettings) -> Self {
        FrontendCtx {
            files,
            parser_file,
            settings,
            errors: vec![],
        }
    }

    fn build_error(
        &self,
        span: &Span,
        msg: DiagnosticInfoMessage,
        file_name: BffFileName,
    ) -> DiagnosticInformation {
        let file_content = self.files.get_existing_file(&file_name);
        Location::build(file_content, span, &file_name).to_info(msg)
    }
    fn push_error(&mut self, span: &Span, msg: DiagnosticInfoMessage, file_name: BffFileName) {
        self.errors
            .push(self.build_error(span, msg, file_name).to_diag(None));
    }

    fn error<T>(
        &mut self,
        span: &Span,
        msg: DiagnosticInfoMessage,
        file_name: BffFileName,
    ) -> Result<T> {
        let e = anyhow!("{:?}", &msg);
        self.push_error(span, msg, file_name);
        Err(e)
    }

    fn res_error<T>(
        &mut self,
        span: &Span,
        msg: DiagnosticInfoMessage,
        file_name: BffFileName,
    ) -> Res<T> {
        let e = self.build_error(span, msg, file_name).to_diag(None);
        Err(Box::new(e))
    }

    fn get_addressed_type(&mut self, addr: &ModuleItemAddress, span: &Span) -> Res<AddressedType> {
        let parsed_module = self
            .files
            .get_existing_file(&addr.file)
            .expect("should have been parsed");

        match addr.namespace {
            TsNamespace::Type => {
                if let Some((type_params, type_)) = parsed_module.locals.type_aliases.get(&addr.key)
                {
                    assert!(
                        type_params.is_none(),
                        "generic type aliases not supported yet"
                    );
                    return Ok(AddressedType::TsType(type_params.clone(), type_.clone()));
                }

                // TODO: interfaces,  enums

                if let Some(imported) = parsed_module.imports.get(&addr.key) {
                    match imported.as_ref() {
                        ImportReference::Named {
                            original_name,
                            file_name,
                            span,
                        } => {
                            let new_addr = ModuleItemAddress {
                                file: file_name.clone(),
                                key: (*original_name).to_string(),
                                namespace: addr.namespace,
                                visibility: Visibility::Export,
                            };
                            return self.get_addressed_type(&new_addr, span);
                        }
                        ImportReference::Star { file_name, span } => todo!(),
                        ImportReference::Default { file_name } => todo!(),
                    }
                }

                self.res_error(
                    span,
                    DiagnosticInfoMessage::CannotResolveAddress(addr.clone()),
                    addr.file.clone(),
                )
            }
            TsNamespace::Value => todo!(),
        }
    }
    fn resolve_ident(
        &mut self,
        i: &Ident,
        file: BffFileName,
        ns: TsNamespace,
        visibility: Visibility,
    ) -> Res<Runtype> {
        let address = ModuleItemAddress::from_ident(i, file, ns, visibility);
        let addressed_type = self.get_addressed_type(&address, &i.span)?;
        match addressed_type {
            AddressedType::TsType(ts_type_param_decl, ts_type) => {
                assert!(
                    ts_type_param_decl.is_none(),
                    "generic types not supported yet"
                );
                let runtype = self.extract_type(&ts_type, address.file.clone(), visibility)?;
                Ok(runtype)
            }
            AddressedType::TsInterfaceDecl(ts_interface_decl) => todo!(),
            AddressedType::TsEnumDecl(ts_enum_decl) => todo!(),
        }
    }

    fn extract_type_ident(
        &mut self,
        i: &Ident,
        type_args: &Option<Box<TsTypeParamInstantiation>>,
        file: BffFileName,
        visibility: Visibility,
    ) -> Res<Runtype> {
        assert!(type_args.is_none(), "generic types not supported yet");
        let resolved = self.resolve_ident(i, file.clone(), TsNamespace::Type, visibility)?;
        Ok(resolved)
    }

    fn extract_type_qualified_name(
        &mut self,
        q: &TsQualifiedName,
        type_args: &Option<Box<TsTypeParamInstantiation>>,
        file: BffFileName,
    ) -> Res<Runtype> {
        todo!()
    }

    fn extract_type_ref(
        &mut self,
        ty: &TsTypeRef,
        file: BffFileName,
        visibility: Visibility,
    ) -> Res<Runtype> {
        let TsTypeRef {
            type_name,
            type_params,
            span: _,
        } = ty;
        match type_name {
            TsEntityName::Ident(ident) => {
                self.extract_type_ident(ident, type_params, file, visibility)
            }
            TsEntityName::TsQualifiedName(ts_qualified_name) => {
                self.extract_type_qualified_name(ts_qualified_name, type_params, file)
            }
        }
    }

    fn extract_ts_keyword_type(&mut self, ty: &TsKeywordType) -> Res<Runtype> {
        match ty.kind {
            TsKeywordTypeKind::TsStringKeyword => Ok(Runtype::String),
            TsKeywordTypeKind::TsAnyKeyword => todo!(),
            TsKeywordTypeKind::TsUnknownKeyword => todo!(),
            TsKeywordTypeKind::TsNumberKeyword => todo!(),
            TsKeywordTypeKind::TsObjectKeyword => todo!(),
            TsKeywordTypeKind::TsBooleanKeyword => todo!(),
            TsKeywordTypeKind::TsBigIntKeyword => todo!(),
            TsKeywordTypeKind::TsSymbolKeyword => todo!(),
            TsKeywordTypeKind::TsVoidKeyword => todo!(),
            TsKeywordTypeKind::TsUndefinedKeyword => todo!(),
            TsKeywordTypeKind::TsNullKeyword => todo!(),
            TsKeywordTypeKind::TsNeverKeyword => todo!(),
            TsKeywordTypeKind::TsIntrinsicKeyword => todo!(),
        }
    }

    fn extract_type(
        &mut self,
        ty: &TsType,
        file: BffFileName,
        visibility: Visibility,
    ) -> Res<Runtype> {
        match ty {
            TsType::TsTypeRef(ts_type_ref) => self.extract_type_ref(ts_type_ref, file, visibility),
            TsType::TsKeywordType(ts_keyword_type) => self.extract_ts_keyword_type(ts_keyword_type),
            TsType::TsThisType(ts_this_type) => todo!(),
            TsType::TsFnOrConstructorType(ts_fn_or_constructor_type) => todo!(),
            TsType::TsTypeQuery(ts_type_query) => todo!(),
            TsType::TsTypeLit(ts_type_lit) => todo!(),
            TsType::TsArrayType(ts_array_type) => todo!(),
            TsType::TsTupleType(ts_tuple_type) => todo!(),
            TsType::TsOptionalType(ts_optional_type) => todo!(),
            TsType::TsRestType(ts_rest_type) => todo!(),
            TsType::TsUnionOrIntersectionType(ts_union_or_intersection_type) => todo!(),
            TsType::TsConditionalType(ts_conditional_type) => todo!(),
            TsType::TsInferType(ts_infer_type) => todo!(),
            TsType::TsParenthesizedType(ts_parenthesized_type) => todo!(),
            TsType::TsTypeOperator(ts_type_operator) => todo!(),
            TsType::TsIndexedAccessType(ts_indexed_access_type) => todo!(),
            TsType::TsMappedType(ts_mapped_type) => todo!(),
            TsType::TsLitType(ts_lit_type) => todo!(),
            TsType::TsTypePredicate(ts_type_predicate) => todo!(),
            TsType::TsImportType(ts_import_type) => todo!(),
        }
    }
    fn extract_one_built_decoder_v2(&mut self, prop: &TsTypeElement) -> Result<BuiltDecoder> {
        match prop {
            TsTypeElement::TsPropertySignature(TsPropertySignature {
                key,
                type_ann,
                type_params,
                span,
                ..
            }) => {
                if type_params.is_some() {
                    return self.error(
                        span,
                        DiagnosticInfoMessage::GenericDecoderIsNotSupported,
                        self.parser_file.clone(),
                    );
                }

                let key = match &**key {
                    Expr::Ident(ident) => ident.sym.to_string(),
                    _ => {
                        return self.error(
                            span,
                            DiagnosticInfoMessage::InvalidDecoderKey,
                            self.parser_file.clone(),
                        );
                    }
                };
                match type_ann.as_ref().map(|it| &it.type_ann) {
                    Some(ann) => {
                        let schema = match self.extract_type(
                            ann,
                            self.parser_file.clone(),
                            Visibility::Local,
                        ) {
                            Ok(s) => s,
                            Err(diag) => {
                                self.errors.push(*diag);
                                Runtype::Any
                            }
                        };

                        //
                        Ok(BuiltDecoder {
                            exported_name: key,
                            schema: schema,
                        })
                    }
                    None => self.error(
                        span,
                        DiagnosticInfoMessage::DecoderMustHaveTypeAnnotation,
                        self.parser_file.clone(),
                    ),
                }
            }
            TsTypeElement::TsGetterSignature(TsGetterSignature { span, .. })
            | TsTypeElement::TsSetterSignature(TsSetterSignature { span, .. })
            | TsTypeElement::TsMethodSignature(TsMethodSignature { span, .. })
            | TsTypeElement::TsIndexSignature(TsIndexSignature { span, .. })
            | TsTypeElement::TsCallSignatureDecl(TsCallSignatureDecl { span, .. })
            | TsTypeElement::TsConstructSignatureDecl(TsConstructSignatureDecl { span, .. }) => {
                self.error(
                    span,
                    DiagnosticInfoMessage::InvalidDecoderProperty,
                    self.parser_file.clone(),
                )
            }
        }
    }
    pub fn extract_built_decoders_from_call_v2(
        &mut self,
        params: &TsTypeParamInstantiation,
    ) -> Result<Vec<BuiltDecoder>> {
        match params.params.split_first() {
            Some((head, tail)) => {
                if !tail.is_empty() {
                    return self.error(
                        &params.span,
                        DiagnosticInfoMessage::TooManyTypeParamsOnDecoder,
                        self.parser_file.clone(),
                    );
                }
                match &**head {
                    TsType::TsTypeLit(TsTypeLit { members, .. }) => members
                        .iter()
                        .map(|prop| self.extract_one_built_decoder_v2(prop))
                        .collect(),
                    _ => self.error(
                        &params.span,
                        DiagnosticInfoMessage::DecoderShouldBeObjectWithTypesAndNames,
                        self.parser_file.clone(),
                    ),
                }
            }
            None => self.error(
                &params.span,
                DiagnosticInfoMessage::TooFewTypeParamsOnDecoder,
                self.parser_file.clone(),
            ),
        }
    }
}
