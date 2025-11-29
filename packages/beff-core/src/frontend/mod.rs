use crate::{
    BeffUserSettings, BffFileName, FileManager, ImportReference, ModuleItemAddress, ParsedModule,
    SymbolExport, SymbolExportDefault, Visibility,
    ast::runtype::{Runtype, RuntypeConst},
    diag::{Diagnostic, DiagnosticInfoMessage, DiagnosticInformation, Location},
    parser_extractor::BuiltDecoder,
};
use anyhow::{Result, anyhow};
use std::rc::Rc;
use swc_common::{Span, Spanned};
use swc_ecma_ast::{
    Expr, Ident, Lit, Prop, PropName, PropOrSpread, TsCallSignatureDecl, TsConstructSignatureDecl,
    TsEntityName, TsEnumDecl, TsGetterSignature, TsIndexSignature, TsInterfaceDecl, TsKeywordType,
    TsKeywordTypeKind, TsLit, TsLitType, TsMethodSignature, TsPropertySignature, TsQualifiedName,
    TsSetterSignature, TsType, TsTypeAliasDecl, TsTypeElement, TsTypeLit, TsTypeParamInstantiation,
    TsTypeQuery, TsTypeQueryExpr, TsTypeRef,
};

pub struct FrontendCtx<'a, R: FileManager> {
    pub files: &'a mut R,
    pub settings: &'a BeffUserSettings,

    pub parser_file: BffFileName,
    pub errors: Vec<Diagnostic>,
}

pub enum AddressedType {
    TsType(Rc<TsTypeAliasDecl>, BffFileName),
    TsInterfaceDecl(Rc<TsInterfaceDecl>, BffFileName),
    TsEnumDecl(Rc<TsEnumDecl>, BffFileName),
}

#[derive(Debug)]
pub enum AddressedQualifiedType {
    StarImport(BffFileName),
}

pub enum AddressedValue {
    ValueExpr(Rc<Expr>, BffFileName),
    TsTypeDecl(Rc<TsType>, BffFileName),
}

pub enum AddressedQualifiedValue {
    StarOfFile(BffFileName),
    ValueExpr(Rc<Expr>, BffFileName),
}

type Res<T> = Result<T, Box<Diagnostic>>;

trait TypeModuleWalker<'a, R: FileManager + 'a, U> {
    fn get_ctx<'b>(&'b mut self) -> &'b mut FrontendCtx<'a, R>;

    fn get_addressed_item_from_default_import(
        &mut self,
        file_name: BffFileName,
        span: &Span,
    ) -> Res<U> {
        match &self
            .get_ctx()
            .get_or_fetch_file(&file_name, span)?
            .symbol_exports
            .export_default
        {
            Some(export_default_symbol) => match export_default_symbol.as_ref() {
                SymbolExportDefault::Expr {
                    export_expr: symbol_export,
                    span,
                    file_name,
                } => match symbol_export.as_ref() {
                    Expr::Ident(i) => {
                        let new_addr = ModuleItemAddress {
                            file: file_name.clone(),
                            key: i.sym.to_string(),
                            visibility: Visibility::Local,
                        };
                        return self.get_addressed_item(&new_addr, span);
                    }
                    _ => todo!(),
                },
                SymbolExportDefault::Renamed { export } => {
                    return self.get_addressed_item_from_symbol_exports(&export, span);
                }
            },
            None => todo!(),
        }
    }

    fn get_addressed_item_from_import_reference(
        &mut self,
        imported: &ImportReference,
        span: &Span,
    ) -> Res<U> {
        match imported {
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
                return self.get_addressed_item(&new_addr, span);
            }
            ImportReference::Star { file_name, span } => {
                return self.get_item_from_star_import(file_name.clone(), span);
            }
            ImportReference::Default { file_name } => {
                return self.get_addressed_item_from_default_import(file_name.clone(), span);
            }
        }
    }

    fn get_item_from_star_import(&mut self, file_name: BffFileName, span: &Span) -> Res<U>;

    fn get_addressed_item_from_symbol_exports(
        &mut self,
        export: &SymbolExport,
        span: &Span,
    ) -> Res<U>;
    fn maybe_get_addressed_item_from_local_ts_type(
        &mut self,
        ts_type: &Rc<TsTypeAliasDecl>,
        file: BffFileName,
    ) -> Res<Option<U>>;

    fn get_addressed_item(&mut self, addr: &ModuleItemAddress, span: &Span) -> Res<U> {
        let parsed_module = self.get_ctx().get_or_fetch_adressed_file(addr, span)?;
        match addr.visibility {
            Visibility::Local => {
                if let Some(ts_type) = parsed_module.locals.type_aliases.get(&addr.key)
                    && let Some(res) = self
                        .maybe_get_addressed_item_from_local_ts_type(ts_type, addr.file.clone())?
                {
                    return Ok(res);
                }

                // TODO: interfaces,  enums

                if let Some(imported) = parsed_module.imports.get(&addr.key) {
                    return self.get_addressed_item_from_import_reference(imported, span);
                }

                todo!()
            }
            Visibility::Export => {
                if addr.key == "default" {
                    return self.get_addressed_item_from_default_import(addr.file.clone(), span);
                }

                if let Some(export) = parsed_module
                    .symbol_exports
                    .get_type(&addr.key, self.get_ctx().files)
                {
                    return self.get_addressed_item_from_symbol_exports(&export, span);
                }
                todo!()
            }
        }
    }
}

pub struct TypeWalker<'a, 'b, R: FileManager> {
    pub ctx: &'b mut FrontendCtx<'a, R>,
}
pub struct QualifiedTypeWalker<'a, 'b, R: FileManager> {
    pub ctx: &'b mut FrontendCtx<'a, R>,
}

impl<'a, 'b, R: FileManager> TypeModuleWalker<'a, R, AddressedType> for TypeWalker<'a, 'b, R> {
    fn get_ctx<'c>(&'c mut self) -> &'c mut FrontendCtx<'a, R> {
        self.ctx
    }

    fn get_addressed_item_from_symbol_exports(
        &mut self,
        export: &SymbolExport,
        _span: &Span,
    ) -> Res<AddressedType> {
        match export {
            SymbolExport::TsType {
                decl,
                original_file,
            } => {
                return Ok(AddressedType::TsType(decl.clone(), original_file.clone()));
            }
            SymbolExport::TsInterfaceDecl {
                decl,
                original_file,
            } => {
                return Ok(AddressedType::TsInterfaceDecl(
                    decl.clone(),
                    original_file.clone(),
                ));
            }
            SymbolExport::TsEnumDecl {
                decl,
                original_file,
            } => {
                return Ok(AddressedType::TsEnumDecl(
                    decl.clone(),
                    original_file.clone(),
                ));
            }
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
                return self.get_addressed_item(&new_addr, span);
            }
        }
    }

    fn maybe_get_addressed_item_from_local_ts_type(
        &mut self,
        ts_type: &Rc<TsTypeAliasDecl>,
        file: BffFileName,
    ) -> Res<Option<AddressedType>> {
        Ok(Some(AddressedType::TsType(ts_type.clone(), file)))
    }

    fn get_item_from_star_import(
        &mut self,
        _file_name: BffFileName,
        _span: &Span,
    ) -> Res<AddressedType> {
        // should have called get_addressed_qualified_type
        todo!()
    }
}

impl<'a, 'b, R: FileManager> TypeModuleWalker<'a, R, AddressedQualifiedType>
    for QualifiedTypeWalker<'a, 'b, R>
{
    fn get_ctx<'c>(&'c mut self) -> &'c mut FrontendCtx<'a, R> {
        self.ctx
    }

    fn get_addressed_item_from_symbol_exports(
        &mut self,
        export: &SymbolExport,
        span: &Span,
    ) -> Res<AddressedQualifiedType> {
        match export {
            SymbolExport::StarOfOtherFile { reference, span: _ } => {
                return self.get_addressed_item_from_import_reference(&reference, span);
            }
            SymbolExport::TsType { .. } => todo!(),
            SymbolExport::TsInterfaceDecl { .. } => todo!(),
            SymbolExport::TsEnumDecl { .. } => todo!(),
            SymbolExport::ValueExpr { .. } => todo!(),
            SymbolExport::ExprDecl { .. } => todo!(),
            SymbolExport::SomethingOfOtherFile { .. } => todo!(),
        }
    }

    fn maybe_get_addressed_item_from_local_ts_type(
        &mut self,
        _ts_type: &Rc<TsTypeAliasDecl>,
        _file: BffFileName,
    ) -> Res<Option<AddressedQualifiedType>> {
        Ok(None)
    }

    fn get_item_from_star_import(
        &mut self,
        file_name: BffFileName,
        _span: &Span,
    ) -> Res<AddressedQualifiedType> {
        Ok(AddressedQualifiedType::StarImport(file_name))
    }
}

trait ValueModuleWalker<'a, R: FileManager + 'a, U> {
    fn get_ctx<'b>(&'b mut self) -> &'b mut FrontendCtx<'a, R>;

    fn get_addressed_value_from_symbol_export(&mut self, exports: &SymbolExport) -> Res<U>;
    fn handle_symbol_export_expr(
        &mut self,
        symbol_export: &Rc<Expr>,
        file_name: &BffFileName,
    ) -> Res<U>;

    fn handle_symbol_export_default_expr(
        &mut self,
        symbol_export: &Rc<Expr>,
        file_name: &BffFileName,
    ) -> Res<U>;

    fn handle_symbol_export_expr_decl(
        &mut self,
        symbol_export: &Rc<TsType>,
        file_name: &BffFileName,
    ) -> Res<U>;
    fn handle_import_star(&mut self, file_name: BffFileName) -> Res<U>;

    fn get_addressed_item_from_default_import(
        &mut self,
        file_name: BffFileName,
        span: &Span,
    ) -> Res<U> {
        match &self
            .get_ctx()
            .get_or_fetch_file(&file_name, span)?
            .symbol_exports
            .export_default
        {
            Some(export_default_symbol) => match export_default_symbol.as_ref() {
                SymbolExportDefault::Expr {
                    export_expr: symbol_export,
                    span: _,
                    file_name,
                } => {
                    return self.handle_symbol_export_default_expr(symbol_export, file_name);
                }
                SymbolExportDefault::Renamed { export } => {
                    return self.get_addressed_value_from_symbol_export(export);
                }
            },
            None => todo!(),
        }
    }
    fn get_addressed_item_from_import_reference(
        &mut self,
        imported: &ImportReference,
        span: &Span,
    ) -> Res<U> {
        match imported {
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
                return self.get_addressed_item(&new_addr, span);
            }
            ImportReference::Star { file_name, span: _ } => {
                return self.handle_import_star(file_name.clone());
            }
            ImportReference::Default { file_name } => {
                return self.get_addressed_item_from_default_import(file_name.clone(), span);
            }
        }
    }
    fn get_addressed_item(&mut self, addr: &ModuleItemAddress, span: &Span) -> Res<U> {
        let parsed_module = self.get_ctx().get_or_fetch_adressed_file(addr, span)?;
        match addr.visibility {
            Visibility::Local => {
                if let Some(imported) = parsed_module.imports.get(&addr.key) {
                    return self.get_addressed_item_from_import_reference(imported, span);
                }

                if let Some(expr) = parsed_module.locals.exprs.get(&addr.key) {
                    //    return Ok(AddressedValue::ValueExpr(expr.clone(), addr.file.clone()));
                    return self.handle_symbol_export_expr(expr, &addr.file);
                }
                if let Some(decl_expr) = parsed_module.locals.exprs_decls.get(&addr.key) {
                    // return Ok(AddressedValue::TsTypeDecl(
                    //     decl_expr.clone(),
                    //     addr.file.clone(),
                    // ));
                    return self.handle_symbol_export_expr_decl(decl_expr, &addr.file);
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
                            return self.get_addressed_item(&new_addr, span);
                        }
                        ImportReference::Star { .. } => {
                            todo!()
                        }
                        ImportReference::Default { file_name } => {
                            return self
                                .get_addressed_item_from_default_import(file_name.clone(), span);
                        }
                    }
                }
                //
                todo!()
            }
            Visibility::Export => {
                if addr.key == "default" {
                    return self.get_addressed_item_from_default_import(addr.file.clone(), span);
                }

                if let Some(exports) = parsed_module
                    .symbol_exports
                    .get_value(&addr.key, self.get_ctx().files)
                {
                    return self.get_addressed_value_from_symbol_export(&exports);
                }

                todo!()
            }
        }
    }
}

struct ValueWalker<'a, 'b, R: FileManager> {
    pub ctx: &'b mut FrontendCtx<'a, R>,
}

impl<'a, 'b, R: FileManager> ValueModuleWalker<'a, R, AddressedValue> for ValueWalker<'a, 'b, R> {
    fn get_ctx<'c>(&'c mut self) -> &'c mut FrontendCtx<'a, R> {
        self.ctx
    }

    fn get_addressed_value_from_symbol_export(
        &mut self,
        exports: &SymbolExport,
    ) -> Res<AddressedValue> {
        match exports {
            SymbolExport::TsType { .. }
            | SymbolExport::TsInterfaceDecl { .. }
            | SymbolExport::TsEnumDecl { .. } => todo!(),
            SymbolExport::ValueExpr {
                expr,
                original_file,
                span: _,
                name: _,
            } => {
                return Ok(AddressedValue::ValueExpr(
                    expr.clone(),
                    original_file.clone(),
                ));
            }
            SymbolExport::ExprDecl {
                name: _,
                span: _,
                original_file,
                ty,
            } => {
                return Ok(AddressedValue::TsTypeDecl(
                    ty.clone(),
                    original_file.clone(),
                ));
            }

            SymbolExport::StarOfOtherFile { .. } => {
                // star of other file should be already resolved by the "get_value" function
                todo!()
            }
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
                return self.get_addressed_item(&new_addr, span);
            }
        }
    }

    fn handle_symbol_export_expr(
        &mut self,
        symbol_export: &Rc<Expr>,
        file_name: &BffFileName,
    ) -> Res<AddressedValue> {
        return Ok(AddressedValue::ValueExpr(
            symbol_export.clone(),
            file_name.clone(),
        ));
    }

    fn handle_symbol_export_expr_decl(
        &mut self,
        symbol_export: &Rc<TsType>,
        file_name: &BffFileName,
    ) -> Res<AddressedValue> {
        return Ok(AddressedValue::TsTypeDecl(
            symbol_export.clone(),
            file_name.clone(),
        ));
    }

    fn handle_import_star(&mut self, _file_name: BffFileName) -> Res<AddressedValue> {
        // should call qualified version insteaed, it's an error
        todo!()
    }

    fn handle_symbol_export_default_expr(
        &mut self,
        symbol_export: &Rc<Expr>,
        file_name: &BffFileName,
    ) -> Res<AddressedValue> {
        return Ok(AddressedValue::ValueExpr(
            symbol_export.clone(),
            file_name.clone(),
        ));
    }
}
struct QaulifiedValueWalker<'a, 'b, R: FileManager> {
    pub ctx: &'b mut FrontendCtx<'a, R>,
}

impl<'a, 'b, R: FileManager> ValueModuleWalker<'a, R, AddressedQualifiedValue>
    for QaulifiedValueWalker<'a, 'b, R>
{
    fn get_ctx<'c>(&'c mut self) -> &'c mut FrontendCtx<'a, R> {
        self.ctx
    }

    fn get_addressed_value_from_symbol_export(
        &mut self,
        exports: &SymbolExport,
    ) -> Res<AddressedQualifiedValue> {
        match exports {
            SymbolExport::StarOfOtherFile { reference, span } => {
                return self.get_addressed_item_from_import_reference(reference.as_ref(), span);
            }
            SymbolExport::TsType { .. } => todo!(),
            SymbolExport::TsInterfaceDecl { .. } => todo!(),
            SymbolExport::TsEnumDecl { .. } => todo!(),
            SymbolExport::ValueExpr {
                expr,
                name: _,
                span: _,
                original_file,
            } => {
                return Ok(AddressedQualifiedValue::ValueExpr(
                    expr.clone(),
                    original_file.clone(),
                ));
            }
            SymbolExport::ExprDecl { .. } => todo!(),
            SymbolExport::SomethingOfOtherFile { .. } => todo!(),
        }
    }

    fn handle_symbol_export_expr(
        &mut self,
        symbol_export: &Rc<Expr>,
        file_name: &BffFileName,
    ) -> Res<AddressedQualifiedValue> {
        return Ok(AddressedQualifiedValue::ValueExpr(
            symbol_export.clone(),
            file_name.clone(),
        ));
    }

    fn handle_symbol_export_expr_decl(
        &mut self,
        _symbol_export: &Rc<TsType>,
        _file_name: &BffFileName,
    ) -> Res<AddressedQualifiedValue> {
        todo!()
    }

    fn handle_import_star(&mut self, file_name: BffFileName) -> Res<AddressedQualifiedValue> {
        return Ok(AddressedQualifiedValue::StarOfFile(file_name));
    }

    fn handle_symbol_export_default_expr(
        &mut self,
        symbol_export: &Rc<Expr>,
        file_name: &BffFileName,
    ) -> Res<AddressedQualifiedValue> {
        match symbol_export.as_ref() {
            Expr::Ident(i) => {
                let new_addr = ModuleItemAddress {
                    file: file_name.clone(),
                    key: i.sym.to_string(),
                    visibility: Visibility::Local,
                };
                return self.get_addressed_item(&new_addr, &i.span);
            }
            _ => todo!(),
        }
    }
}
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

    fn get_addressed_type(&mut self, addr: &ModuleItemAddress, span: &Span) -> Res<AddressedType> {
        let mut walker = TypeWalker { ctx: self };
        walker.get_addressed_item(addr, span)
    }

    fn get_addressed_qualified_type(
        &mut self,
        addr: &ModuleItemAddress,
        span: &Span,
    ) -> Res<AddressedQualifiedType> {
        let mut walker = QualifiedTypeWalker { ctx: self };
        walker.get_addressed_item(addr, span)
    }

    fn get_addressed_value(
        &mut self,
        addr: &ModuleItemAddress,
        span: &Span,
    ) -> Res<AddressedValue> {
        let mut walker = ValueWalker { ctx: self };
        walker.get_addressed_item(addr, span)
    }

    fn get_addressed_qualified_value(
        &mut self,
        addr: &ModuleItemAddress,
        span: &Span,
    ) -> Res<AddressedQualifiedValue> {
        let mut walker = QaulifiedValueWalker { ctx: self };
        walker.get_addressed_item(addr, span)
    }

    fn extract_addressed_type(&mut self, address: &ModuleItemAddress, span: &Span) -> Res<Runtype> {
        let addressed_type = self.get_addressed_type(address, span)?;
        match addressed_type {
            AddressedType::TsType(decl, original_file) => {
                assert!(
                    decl.type_params.is_none(),
                    "generic types not supported yet"
                );
                let runtype =
                    self.extract_type(&decl.type_ann, original_file.clone(), address.visibility)?;
                Ok(runtype)
            }
            AddressedType::TsInterfaceDecl(_, _) => todo!(),
            AddressedType::TsEnumDecl(_, _) => todo!(),
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

    fn get_adressed_qualified_type_from_entity_name(
        &mut self,
        q: &TsEntityName,
        file: BffFileName,
    ) -> Res<AddressedQualifiedType> {
        match q {
            TsEntityName::TsQualifiedName(ts_qualified_name) => {
                let left_part = self.get_adressed_qualified_type_from_entity_name(
                    &ts_qualified_name.left,
                    file.clone(),
                )?;
                match left_part {
                    AddressedQualifiedType::StarImport(bff_file_name) => {
                        let new_addr = ModuleItemAddress {
                            file: bff_file_name.clone(),
                            key: ts_qualified_name.right.sym.to_string(),
                            // TODO: is visibility correct here?
                            visibility: Visibility::Export,
                        };
                        return self.get_addressed_qualified_type(&new_addr, &q.span());
                    }
                }
            }
            TsEntityName::Ident(ident) => {
                let addr = ModuleItemAddress::from_ident(
                    ident,
                    file.clone(),
                    // TODO: is visibility correct here?
                    Visibility::Local,
                );
                let type_addressed = self.get_addressed_qualified_type(&addr, &q.span())?;
                Ok(type_addressed)
            }
        }
    }

    fn extract_type_qualified_name(
        &mut self,
        q: &TsQualifiedName,
        type_args: &Option<Box<TsTypeParamInstantiation>>,
        file: BffFileName,
        visibility: Visibility,
    ) -> Res<Runtype> {
        assert!(type_args.is_none(), "generic types not supported yet");
        let type_addressed = self.get_adressed_qualified_type_from_entity_name(&q.left, file)?;
        match type_addressed {
            AddressedQualifiedType::StarImport(bff_file_name) => {
                let new_addr = ModuleItemAddress {
                    file: bff_file_name.clone(),
                    key: q.right.sym.to_string(),
                    visibility,
                };
                return self.extract_addressed_type(&new_addr, &q.span());
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
            TsEntityName::TsQualifiedName(ts_qualified_name) => self.extract_type_qualified_name(
                ts_qualified_name,
                type_params,
                file,
                // TODO: is the visibility correct here?
                Visibility::Export,
            ),
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
                let new_addr = ModuleItemAddress {
                    file: file.clone(),
                    key: i.sym.to_string(),
                    visibility: Visibility::Local,
                };
                return self.extract_addressed_value(&new_addr, &e.span());
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
            AddressedValue::TsTypeDecl(ts_type, bff_file_name) => {
                self.extract_type(&ts_type, bff_file_name, address.visibility)
            }
        }
    }

    fn get_addressed_qualified_value_from_entity_name(
        &mut self,
        q: &TsEntityName,
        file: BffFileName,
    ) -> Res<AddressedQualifiedValue> {
        match q {
            TsEntityName::TsQualifiedName(ts_qualified_name) => {
                let left_part = self.get_addressed_qualified_value_from_entity_name(
                    &ts_qualified_name.left,
                    file.clone(),
                )?;
                match left_part {
                    AddressedQualifiedValue::StarOfFile(bff_file_name) => {
                        let new_addr = ModuleItemAddress {
                            file: bff_file_name.clone(),
                            key: ts_qualified_name.right.sym.to_string(),
                            // TODO: is visibility correct here?
                            visibility: Visibility::Export,
                        };
                        return self.get_addressed_qualified_value(&new_addr, &q.span());
                    }
                    AddressedQualifiedValue::ValueExpr(_, _) => todo!(),
                }
            }
            TsEntityName::Ident(ident) => {
                let addr = ModuleItemAddress::from_ident(
                    ident,
                    file.clone(),
                    // TODO: is visibility correct here?
                    Visibility::Local,
                );
                let value_addressed = self.get_addressed_qualified_value(&addr, &q.span())?;
                Ok(value_addressed)
            }
        }
    }

    fn typeof_expr_keyed_access(
        &mut self,
        expr: &Expr,
        key: &Ident,
        file: BffFileName,
    ) -> Res<Runtype> {
        // TODO: infer the whole expr and do an indexed access?
        match expr {
            Expr::Object(object_lit) => {
                for prop in &object_lit.props {
                    if let PropOrSpread::Prop(boxed_prop) = prop
                        && let Prop::KeyValue(key_value_prop) = boxed_prop.as_ref()
                        && let PropName::Ident(ident) = &key_value_prop.key
                        && ident.sym == key.sym
                    {
                        return self.typeof_expr(key_value_prop.value.as_ref(), false, file);
                    }
                }
                todo!()
            }
            _ => {
                dbg!(&expr);
                todo!()
            }
        }
    }

    fn extract_value_from_ts_qualified_name(
        &mut self,
        ts_qualified_name: &TsQualifiedName,
        file: BffFileName,
        visibility: Visibility,
        span: &Span,
    ) -> Res<Runtype> {
        let left_value = self.get_addressed_qualified_value_from_entity_name(
            &ts_qualified_name.left,
            file.clone(),
        )?;

        match left_value {
            AddressedQualifiedValue::StarOfFile(bff_file_name) => {
                let new_addr = ModuleItemAddress {
                    file: bff_file_name.clone(),
                    key: ts_qualified_name.right.sym.to_string(),
                    visibility,
                };
                return self.extract_addressed_value(&new_addr, &span);
            }
            AddressedQualifiedValue::ValueExpr(expr, bff_file_name) => self
                .typeof_expr_keyed_access(expr.as_ref(), &ts_qualified_name.right, bff_file_name),
        }
    }

    fn extract_value_ts_entity_name(
        &mut self,
        ts_entity_name: &TsEntityName,
        file: BffFileName,
        visibility: Visibility,
        span: &Span,
    ) -> Res<Runtype> {
        match ts_entity_name {
            TsEntityName::Ident(ident) => {
                let addr = ModuleItemAddress::from_ident(ident, file.clone(), visibility);
                self.extract_addressed_value(&addr, &span)
            }
            TsEntityName::TsQualifiedName(ts_qualified_name) => self
                .extract_value_from_ts_qualified_name(
                    ts_qualified_name,
                    file,
                    // TODO: is the visibility correct here?
                    Visibility::Export,
                    span,
                ),
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
            TsTypeQueryExpr::TsEntityName(ts_entity_name) => {
                self.extract_value_ts_entity_name(ts_entity_name, file, visibility, &ty.span)
            }
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
            TsType::TsLitType(TsLitType { lit, .. }) => match lit {
                TsLit::Number(n) => Ok(Runtype::Const(RuntypeConst::parse_f64(n.value))),
                TsLit::Str(s) => Ok(Runtype::single_string_const(&s.value)),
                TsLit::Bool(b) => Ok(Runtype::Const(RuntypeConst::Bool(b.value))),
                TsLit::BigInt(_) => Ok(Runtype::BigInt),
                TsLit::Tpl(_) => todo!(),
            },
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
