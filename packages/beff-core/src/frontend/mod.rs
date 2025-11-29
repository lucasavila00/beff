use crate::{
    ast::runtype::{Runtype, RuntypeConst},
    diag::{Diagnostic, DiagnosticInfoMessage, DiagnosticInformation, Location},
    parser_extractor::BuiltDecoder,
    BeffUserSettings, BffFileName, FileManager, ImportReference, ModuleItemAddress, ParsedModule,
    SymbolExport, Visibility,
};
use anyhow::{anyhow, Result};
use std::rc::Rc;
use swc_common::{Span, Spanned};
use swc_ecma_ast::{
    Expr, Ident, Lit, TsCallSignatureDecl, TsConstructSignatureDecl, TsEntityName, TsEnumDecl,
    TsGetterSignature, TsIndexSignature, TsInterfaceDecl, TsKeywordType, TsKeywordTypeKind, TsLit,
    TsLitType, TsMethodSignature, TsPropertySignature, TsQualifiedName, TsSetterSignature, TsType,
    TsTypeAliasDecl, TsTypeElement, TsTypeLit, TsTypeParamInstantiation, TsTypeQuery,
    TsTypeQueryExpr, TsTypeRef,
};

pub struct FrontendCtx<'a, R: FileManager> {
    pub files: &'a mut R,
    pub settings: &'a BeffUserSettings,

    pub parser_file: BffFileName,
    pub errors: Vec<Diagnostic>,
}

pub enum AddressedType {
    TsType(Rc<TsTypeAliasDecl>),
    TsInterfaceDecl(Rc<TsInterfaceDecl>),
    TsEnumDecl(Rc<TsEnumDecl>),
}

pub enum AddressedQualifiedType {
    StarExports(BffFileName),
}

pub enum AddressedValue {
    ValueExpr(Rc<Expr>, BffFileName),
}

pub enum AddressedQualifiedValue {
    StarExports(BffFileName),
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

    fn anyhow_error<T>(
        &mut self,
        span: &Span,
        msg: DiagnosticInfoMessage,
        file_name: BffFileName,
    ) -> Result<T> {
        let e = anyhow!("{:?}", &msg);
        self.push_error(span, msg, file_name);
        Err(e)
    }

    fn error<T>(
        &mut self,
        span: &Span,
        msg: DiagnosticInfoMessage,
        file_name: BffFileName,
    ) -> Res<T> {
        let e = self.build_error(span, msg, file_name).to_diag(None);
        Err(Box::new(e))
    }

    fn get_or_fetch_adressed_file(
        &mut self,
        addr: &ModuleItemAddress,
        span: &Span,
    ) -> Res<Rc<ParsedModule>> {
        let parsed_module = self.files.get_or_fetch_file(&addr.file).ok_or_else(|| {
            Box::new(self.build_error(
                span,
                DiagnosticInfoMessage::CouldNotResolveAddressesSymbol(addr.clone()),
                addr.file.clone(),
            ))
            .to_diag(None)
        })?;
        Ok(parsed_module)
    }
    fn get_or_fetch_file(&mut self, file: &BffFileName, span: &Span) -> Res<Rc<ParsedModule>> {
        let parsed_module = self.files.get_or_fetch_file(&file).ok_or_else(|| {
            Box::new(self.build_error(
                span,
                DiagnosticInfoMessage::CannotFindFileWhenConvertingToSchema(file.clone()),
                file.clone(),
            ))
            .to_diag(None)
        })?;
        Ok(parsed_module)
    }

    fn get_addressed_qualified_type(
        &mut self,
        addr: &ModuleItemAddress,
        span: &Span,
    ) -> Res<AddressedQualifiedType> {
        let parsed_module = self.get_or_fetch_adressed_file(addr, span)?;
        match addr.visibility {
            Visibility::Local => {
                if let Some(imported) = parsed_module.imports.get(&addr.key) {
                    match imported.as_ref() {
                        ImportReference::Named { .. } => todo!(),
                        ImportReference::Star { file_name, span: _ } => {
                            return Ok(AddressedQualifiedType::StarExports(file_name.clone()));
                        }
                        ImportReference::Default { .. } => todo!(),
                    }
                }
                todo!()
            }
            Visibility::Export => todo!(),
        }
    }

    fn get_addressed_type(&mut self, addr: &ModuleItemAddress, span: &Span) -> Res<AddressedType> {
        let parsed_module = self.get_or_fetch_adressed_file(addr, span)?;
        match addr.visibility {
            Visibility::Local => {
                if let Some(ts_type) = parsed_module.locals.type_aliases.get(&addr.key) {
                    return Ok(AddressedType::TsType(ts_type.clone()));
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
                                visibility: Visibility::Export,
                            };
                            return self.get_addressed_type(&new_addr, span);
                        }
                        ImportReference::Star { .. } => {
                            // this should have called get_addressed_qualified_type
                            todo!()
                        }
                        ImportReference::Default { file_name } => {
                            match &self.get_or_fetch_file(file_name, span)?.export_default {
                                Some(export_default_symbol) => {
                                    match export_default_symbol.symbol_export.as_ref() {
                                        Expr::Ident(i) => {
                                            let new_addr = ModuleItemAddress {
                                                file: file_name.clone(),
                                                key: i.sym.to_string(),
                                                visibility: Visibility::Local,
                                            };
                                            return self.get_addressed_type(&new_addr, span);
                                        }
                                        _ => todo!(),
                                    }
                                }
                                None => todo!(),
                            }
                        }
                    }
                }

                self.error(
                    span,
                    DiagnosticInfoMessage::CannotResolveAddress(addr.clone()),
                    addr.file.clone(),
                )
            }
            Visibility::Export => {
                if let Some(x) = parsed_module.symbol_exports.get_type(&addr.key, self.files) {
                    match x.as_ref() {
                        SymbolExport::TsType { decl, .. } => {
                            return Ok(AddressedType::TsType(decl.clone()));
                        }
                        SymbolExport::TsInterfaceDecl { .. } => todo!(),
                        SymbolExport::TsEnumDecl { .. } => todo!(),
                        SymbolExport::ValueExpr { .. } => todo!(),
                        SymbolExport::ExprDecl { .. } => todo!(),
                        SymbolExport::StarOfOtherFile { .. } => todo!(),
                        SymbolExport::SomethingOfOtherFile {
                            something,
                            file,
                            span,
                        } => {
                            let new_addr = ModuleItemAddress {
                                file: file.clone(),
                                key: something.clone(),
                                visibility: Visibility::Export,
                            };
                            return self.get_addressed_type(&new_addr, span);
                        }
                    }
                }
                todo!()
            }
        }
    }

    fn get_addressed_qualified_value(
        &mut self,
        addr: &ModuleItemAddress,
        span: &Span,
    ) -> Res<AddressedQualifiedValue> {
        let parsed_module = self.get_or_fetch_adressed_file(addr, span)?;
        match addr.visibility {
            Visibility::Local => {
                if let Some(imported) = parsed_module.imports.get(&addr.key) {
                    match imported.as_ref() {
                        ImportReference::Named { .. } => todo!(),
                        ImportReference::Star { file_name, span: _ } => {
                            return Ok(AddressedQualifiedValue::StarExports(file_name.clone()));
                        }
                        ImportReference::Default { .. } => todo!(),
                    }
                }
                todo!()
            }
            Visibility::Export => todo!(),
        }
    }
    fn get_addressed_value(
        &mut self,
        addr: &ModuleItemAddress,
        span: &Span,
    ) -> Res<AddressedValue> {
        let parsed_module = self.get_or_fetch_adressed_file(addr, span)?;
        match addr.visibility {
            Visibility::Local => {
                if let Some(expr) = parsed_module.locals.exprs.get(&addr.key) {
                    return Ok(AddressedValue::ValueExpr(expr.clone(), addr.file.clone()));
                }
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
                                visibility: Visibility::Export,
                            };
                            return self.get_addressed_value(&new_addr, span);
                        }
                        ImportReference::Star { .. } => {
                            todo!()
                        }
                        ImportReference::Default { file_name } => {
                            match &self.get_or_fetch_file(file_name, span)?.export_default {
                                Some(export_default_symbol) => {
                                    return Ok(AddressedValue::ValueExpr(
                                        export_default_symbol.symbol_export.clone(),
                                        export_default_symbol.file_name.clone(),
                                    ));
                                }
                                None => todo!(),
                            }
                        }
                    }
                }
                //
                todo!()
            }
            Visibility::Export => {
                if let Some(x) = parsed_module
                    .symbol_exports
                    .get_value(&addr.key, self.files)
                {
                    match x.as_ref() {
                        SymbolExport::TsType { .. }
                        | SymbolExport::TsInterfaceDecl { .. }
                        | SymbolExport::TsEnumDecl { .. } => todo!(),
                        SymbolExport::ValueExpr { expr, .. } => {
                            return Ok(AddressedValue::ValueExpr(expr.clone(), addr.file.clone()));
                        }
                        SymbolExport::ExprDecl { .. } => todo!(),
                        SymbolExport::StarOfOtherFile { .. } => todo!(),
                        SymbolExport::SomethingOfOtherFile {
                            something,
                            file,
                            span,
                        } => {
                            let new_addr = ModuleItemAddress {
                                file: file.clone(),
                                key: something.clone(),
                                visibility: Visibility::Export,
                            };
                            return self.get_addressed_value(&new_addr, span);
                        }
                    }
                }
                todo!()
            }
        }
    }
    fn extract_addressed_type(&mut self, address: &ModuleItemAddress, span: &Span) -> Res<Runtype> {
        let addressed_type = self.get_addressed_type(address, span)?;
        match addressed_type {
            AddressedType::TsType(decl) => {
                assert!(
                    decl.type_params.is_none(),
                    "generic types not supported yet"
                );
                let runtype =
                    self.extract_type(&decl.type_ann, address.file.clone(), address.visibility)?;
                Ok(runtype)
            }
            AddressedType::TsInterfaceDecl(_) => todo!(),
            AddressedType::TsEnumDecl(_) => todo!(),
        }
    }
    fn resolve_ident_type(
        &mut self,
        i: &Ident,
        file: BffFileName,
        visibility: Visibility,
    ) -> Res<Runtype> {
        let address = ModuleItemAddress::from_ident(i, file, visibility);
        self.extract_addressed_type(&address, &i.span)
    }

    fn extract_type_ident(
        &mut self,
        i: &Ident,
        type_args: &Option<Box<TsTypeParamInstantiation>>,
        file: BffFileName,
        visibility: Visibility,
    ) -> Res<Runtype> {
        assert!(type_args.is_none(), "generic types not supported yet");
        let resolved = self.resolve_ident_type(i, file.clone(), visibility)?;
        Ok(resolved)
    }

    fn extract_type_qualified_name(
        &mut self,
        q: &TsQualifiedName,
        type_args: &Option<Box<TsTypeParamInstantiation>>,
        file: BffFileName,
    ) -> Res<Runtype> {
        assert!(type_args.is_none(), "generic types not supported yet");
        match &q.left {
            TsEntityName::TsQualifiedName(_) => todo!(),
            TsEntityName::Ident(ident) => {
                let addr = ModuleItemAddress::from_ident(ident, file.clone(), Visibility::Local);
                let type_addressed = self.get_addressed_qualified_type(&addr, &q.span())?;
                match type_addressed {
                    AddressedQualifiedType::StarExports(bff_file_name) => {
                        let new_addr = ModuleItemAddress {
                            file: bff_file_name.clone(),
                            key: q.right.sym.to_string(),
                            visibility: Visibility::Export,
                        };
                        return self.extract_addressed_type(&new_addr, &q.span());
                    }
                }
            }
        }
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
            TsKeywordTypeKind::TsNumberKeyword => Ok(Runtype::Number),
            TsKeywordTypeKind::TsAnyKeyword => todo!(),
            TsKeywordTypeKind::TsUnknownKeyword => todo!(),
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

    pub fn typeof_expr(&mut self, e: &Expr, as_const: bool, file: BffFileName) -> Res<Runtype> {
        match e {
            Expr::TsConstAssertion(e) => self.typeof_expr(&e.expr, true, file),
            Expr::Lit(l) => match l {
                Lit::Str(s) => {
                    if as_const {
                        Ok(Runtype::single_string_const(&s.value))
                    } else {
                        Ok(Runtype::String)
                    }
                }
                Lit::Bool(b) => {
                    if as_const {
                        Ok(Runtype::Const(RuntypeConst::Bool(b.value)))
                    } else {
                        Ok(Runtype::Boolean)
                    }
                }
                Lit::Null(_) => Ok(Runtype::Null),
                Lit::Num(n) => {
                    if as_const {
                        Ok(Runtype::Const(RuntypeConst::parse_f64(n.value)))
                    } else {
                        Ok(Runtype::Number)
                    }
                }
                Lit::BigInt(_) => Ok(Runtype::BigInt),
                Lit::Regex(_) => self.error(
                    &e.span(),
                    DiagnosticInfoMessage::TypeOfRegexNotSupported,
                    file,
                ),
                Lit::JSXText(_) => self.error(
                    &e.span(),
                    DiagnosticInfoMessage::TypeOfJSXTextNotSupported,
                    file,
                ),
            },
            Expr::Ident(i) => {
                dbg!(&i);
                let new_addr = ModuleItemAddress {
                    file: file.clone(),
                    key: i.sym.to_string(),
                    visibility: Visibility::Local,
                };
                let addressed_value = self.get_addressed_value(&new_addr, &i.span)?;
                match addressed_value {
                    AddressedValue::ValueExpr(expr, expr_file) => {
                        self.typeof_expr(expr.as_ref(), as_const, expr_file)
                    }
                }
            }
            _ => {
                dbg!(&e);
                self.error(
                    &e.span(),
                    DiagnosticInfoMessage::CannotConvertExprToSchema,
                    file,
                )
            }
        }
    }

    fn extract_addressed_value(
        &mut self,
        address: &ModuleItemAddress,
        span: &Span,
    ) -> Res<Runtype> {
        let addressed_value = self.get_addressed_value(address, span)?;
        match addressed_value {
            AddressedValue::ValueExpr(expr, expr_file) => {
                self.typeof_expr(expr.as_ref(), false, expr_file)
            }
        }
    }

    fn extract_type_query(
        &mut self,
        ty: &TsTypeQuery,
        file: BffFileName,
        visibility: Visibility,
    ) -> Res<Runtype> {
        if ty.type_args.is_some() {
            return self.error(
                &ty.span,
                DiagnosticInfoMessage::TypeQueryArgsNotSupported,
                file.clone(),
            );
        }

        match &ty.expr_name {
            TsTypeQueryExpr::TsEntityName(ts_entity_name) => match ts_entity_name {
                TsEntityName::Ident(ident) => {
                    //
                    let addr = ModuleItemAddress::from_ident(ident, file.clone(), visibility);
                    return self.extract_addressed_value(&addr, &ty.span);
                }
                TsEntityName::TsQualifiedName(ts_qualified_name) => match &ts_qualified_name.left {
                    TsEntityName::TsQualifiedName(_) => todo!(),
                    TsEntityName::Ident(ident) => {
                        let addr =
                            ModuleItemAddress::from_ident(ident, file.clone(), Visibility::Local);
                        let addressed_qualified_value =
                            self.get_addressed_qualified_value(&addr, &ty.span)?;
                        match addressed_qualified_value {
                            AddressedQualifiedValue::StarExports(bff_file_name) => {
                                let new_addr = ModuleItemAddress {
                                    file: bff_file_name.clone(),
                                    key: ts_qualified_name.right.sym.to_string(),
                                    visibility: Visibility::Export,
                                };
                                return self.extract_addressed_value(&new_addr, &ty.span);
                            }
                        }
                    }
                },
            },
            TsTypeQueryExpr::Import(ts_import_type) => self.error(
                &ts_import_type.span,
                DiagnosticInfoMessage::TypeofImportNotSupported,
                file.clone(),
            ),
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
            TsType::TsTypeQuery(ts_type_query) => {
                self.extract_type_query(ts_type_query, file, visibility)
            }
            TsType::TsThisType(_) => todo!(),
            TsType::TsFnOrConstructorType(_) => todo!(),
            TsType::TsTypeLit(_) => todo!(),
            TsType::TsArrayType(_) => todo!(),
            TsType::TsTupleType(_) => todo!(),
            TsType::TsOptionalType(_) => todo!(),
            TsType::TsRestType(_) => todo!(),
            TsType::TsUnionOrIntersectionType(_) => todo!(),
            TsType::TsConditionalType(_) => todo!(),
            TsType::TsInferType(_) => todo!(),
            TsType::TsParenthesizedType(_) => todo!(),
            TsType::TsTypeOperator(_) => todo!(),
            TsType::TsIndexedAccessType(_) => todo!(),
            TsType::TsMappedType(_) => todo!(),
            TsType::TsLitType(TsLitType { lit, .. }) => match lit {
                TsLit::Number(n) => Ok(Runtype::Const(RuntypeConst::parse_f64(n.value))),
                TsLit::Str(s) => Ok(Runtype::single_string_const(&s.value)),
                TsLit::Bool(b) => Ok(Runtype::Const(RuntypeConst::Bool(b.value))),
                TsLit::BigInt(_) => Ok(Runtype::BigInt),
                TsLit::Tpl(_) => todo!(),
            },
            TsType::TsTypePredicate(_) => todo!(),
            TsType::TsImportType(_) => todo!(),
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
                    return self.anyhow_error(
                        span,
                        DiagnosticInfoMessage::GenericDecoderIsNotSupported,
                        self.parser_file.clone(),
                    );
                }

                let key = match &**key {
                    Expr::Ident(ident) => ident.sym.to_string(),
                    _ => {
                        return self.anyhow_error(
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
                    None => self.anyhow_error(
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
                self.anyhow_error(
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
                    return self.anyhow_error(
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
                    _ => self.anyhow_error(
                        &params.span,
                        DiagnosticInfoMessage::DecoderShouldBeObjectWithTypesAndNames,
                        self.parser_file.clone(),
                    ),
                }
            }
            None => self.anyhow_error(
                &params.span,
                DiagnosticInfoMessage::TooFewTypeParamsOnDecoder,
                self.parser_file.clone(),
            ),
        }
    }
}
