use crate::{
    BeffUserSettings, BffFileName, FileManager, ImportReference, ModuleItemAddress, NamedSchema,
    ParsedModule, SymbolExport, SymbolExportDefault, Visibility,
    ast::runtype::{Optionality, Runtype, RuntypeConst},
    diag::{
        Diagnostic, DiagnosticInfoMessage, DiagnosticInformation, DiagnosticParentMessage, Location,
    },
    parser_extractor::BuiltDecoder,
};
use anyhow::{Result, anyhow};
use std::rc::Rc;
use swc_common::{Span, Spanned};
use swc_ecma_ast::{
    Expr, Ident, Lit, Prop, PropName, PropOrSpread, TsArrayType, TsCallSignatureDecl,
    TsConstructSignatureDecl, TsConstructorType, TsEntityName, TsEnumDecl, TsFnOrConstructorType,
    TsFnType, TsGetterSignature, TsImportType, TsIndexSignature, TsInferType, TsInterfaceDecl,
    TsIntersectionType, TsKeywordType, TsKeywordTypeKind, TsLit, TsLitType, TsMethodSignature,
    TsOptionalType, TsParenthesizedType, TsPropertySignature, TsQualifiedName, TsRestType,
    TsSetterSignature, TsThisType, TsTupleType, TsType, TsTypeAliasDecl, TsTypeElement, TsTypeLit,
    TsTypeOperator, TsTypeOperatorOp, TsTypeParamInstantiation, TsTypePredicate, TsTypeQuery,
    TsTypeQueryExpr, TsTypeRef, TsUnionOrIntersectionType, TsUnionType,
};

pub struct FrontendCtx<'a, R: FileManager> {
    pub files: &'a mut R,
    pub settings: &'a BeffUserSettings,

    pub parser_file: BffFileName,
    pub errors: Vec<Diagnostic>,
    pub validators: Vec<NamedSchema>,
}

pub enum AddressedType {
    TsType {
        t: Rc<TsTypeAliasDecl>,
        file_name: BffFileName,
        name: String,
    },
}

#[derive(PartialEq, PartialOrd)]
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

#[derive(Eq, PartialEq, PartialOrd, Ord, Hash, Clone)]
pub enum FinalAddressedType {
    TsType {
        file_name: BffFileName,
        name: String,
    },
    ItemOfStar {
        file_name: BffFileName,
        key: String,
    },
}

type Res<T> = Result<T, Box<Diagnostic>>;

trait TypeModuleWalker<'a, R: FileManager + 'a, U> {
    fn get_ctx<'b>(&'b mut self) -> &'b mut FrontendCtx<'a, R>;

    fn handle_import_star(&mut self, file_name: BffFileName, span: &Span) -> Res<U>;

    fn get_addressed_item_from_symbol_exports(
        &mut self,
        export: &SymbolExport,
        span: &Span,
    ) -> Res<U>;
    fn maybe_get_addressed_item_from_local_ts_type(
        &mut self,
        ts_type: &Rc<TsTypeAliasDecl>,
        file: BffFileName,
        name: String,
    ) -> Res<Option<U>>;

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
                            name: i.sym.to_string(),
                            visibility: Visibility::Local,
                        };
                        return self.get_addressed_item(&new_addr, span);
                    }
                    _ => {
                        todo!()
                    }
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
                    name: (*original_name).to_string(),
                    visibility: Visibility::Export,
                };
                return self.get_addressed_item(&new_addr, span);
            }
            ImportReference::Star { file_name, span } => {
                return self.handle_import_star(file_name.clone(), span);
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
                if let Some(ts_type) = parsed_module.locals.type_aliases.get(&addr.name)
                    && let Some(res) = self.maybe_get_addressed_item_from_local_ts_type(
                        ts_type,
                        addr.file.clone(),
                        addr.name.clone(),
                    )?
                {
                    return Ok(res);
                }

                // TODO: interfaces,  enums

                if let Some(imported) = parsed_module.imports.get(&addr.name) {
                    return self.get_addressed_item_from_import_reference(imported, span);
                }

                todo!()
            }
            Visibility::Export => {
                if addr.name == "default" {
                    return self.get_addressed_item_from_default_import(addr.file.clone(), span);
                }

                if let Some(export) = parsed_module
                    .symbol_exports
                    .get_type(&addr.name, self.get_ctx().files)
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
                name,
            } => {
                return Ok(AddressedType::TsType {
                    t: decl.clone(),
                    file_name: original_file.clone(),
                    name: name.clone(),
                });
            }
            SymbolExport::TsInterfaceDecl {
                decl,
                original_file,
            } => {
                // return Ok(AddressedType::TsInterfaceDecl(
                //     decl.clone(),
                //     original_file.clone(),
                // ));
                todo!()
            }
            SymbolExport::TsEnumDecl {
                decl,
                original_file,
            } => {
                // return Ok(AddressedType::TsEnumDecl(
                //     decl.clone(),
                //     original_file.clone(),
                // ));
                todo!()
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
                    name: something.clone(),
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
        name: String,
    ) -> Res<Option<AddressedType>> {
        Ok(Some(AddressedType::TsType {
            t: ts_type.clone(),
            file_name: file.clone(),
            name: name,
        }))
    }

    fn handle_import_star(&mut self, _file_name: BffFileName, _span: &Span) -> Res<AddressedType> {
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
        _name: String,
    ) -> Res<Option<AddressedQualifiedType>> {
        Ok(None)
    }

    fn handle_import_star(
        &mut self,
        file_name: BffFileName,
        _span: &Span,
    ) -> Res<AddressedQualifiedType> {
        Ok(AddressedQualifiedType::StarImport(file_name))
    }
}

trait ValueModuleWalker<'a, R: FileManager + 'a, U> {
    fn get_ctx<'b>(&'b mut self) -> &'b mut FrontendCtx<'a, R>;

    fn get_addressed_item_from_symbol_export(&mut self, exports: &SymbolExport) -> Res<U>;
    fn handle_symbol_export_expr(
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
                } => match symbol_export.as_ref() {
                    Expr::Ident(i) => {
                        let new_addr = ModuleItemAddress {
                            file: file_name.clone(),
                            name: i.sym.to_string(),
                            visibility: Visibility::Local,
                        };
                        return self.get_addressed_item(&new_addr, &i.span);
                    }
                    _ => return self.handle_symbol_export_expr(&symbol_export.clone(), file_name),
                },
                SymbolExportDefault::Renamed { export } => {
                    return self.get_addressed_item_from_symbol_export(export);
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
                    name: (*original_name).to_string(),
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
                if let Some(imported) = parsed_module.imports.get(&addr.name) {
                    return self.get_addressed_item_from_import_reference(imported, span);
                }

                if let Some(expr) = parsed_module.locals.exprs.get(&addr.name) {
                    //    return Ok(AddressedValue::ValueExpr(expr.clone(), addr.file.clone()));
                    return self.handle_symbol_export_expr(expr, &addr.file);
                }
                if let Some(decl_expr) = parsed_module.locals.exprs_decls.get(&addr.name) {
                    // return Ok(AddressedValue::TsTypeDecl(
                    //     decl_expr.clone(),
                    //     addr.file.clone(),
                    // ));
                    return self.handle_symbol_export_expr_decl(decl_expr, &addr.file);
                }
                if let Some(imported) = parsed_module.imports.get(&addr.name) {
                    match imported.as_ref() {
                        ImportReference::Named {
                            original_name,
                            file_name,
                            span,
                        } => {
                            let new_addr = ModuleItemAddress {
                                file: file_name.clone(),
                                name: (*original_name).to_string(),
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
                if addr.name == "default" {
                    return self.get_addressed_item_from_default_import(addr.file.clone(), span);
                }

                if let Some(exports) = parsed_module
                    .symbol_exports
                    .get_value(&addr.name, self.get_ctx().files)
                {
                    return self.get_addressed_item_from_symbol_export(&exports);
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

    fn get_addressed_item_from_symbol_export(
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
                    name: something.clone(),
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

    fn get_addressed_item_from_symbol_export(
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
}
impl<'a, R: FileManager> FrontendCtx<'a, R> {
    pub fn new(files: &'a mut R, parser_file: BffFileName, settings: &'a BeffUserSettings) -> Self {
        FrontendCtx {
            files,
            parser_file,
            settings,
            errors: vec![],
            validators: vec![],
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
            AddressedType::TsType {
                t: decl,
                file_name: original_file,
                name,
            } => {
                assert!(
                    decl.type_params.is_none(),
                    "generic types not supported yet"
                );
                let runtype = self.extract_type(&decl.type_ann, original_file.clone())?;
                Ok(runtype)
            }
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
                            name: ts_qualified_name.right.sym.to_string(),
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
                    name: q.right.sym.to_string(),
                    visibility,
                };
                return self.extract_addressed_type(&new_addr, &q.span());
            }
        }
    }

    fn extract_type_from_ts_entity_name(
        &mut self,
        type_name: &TsEntityName,
        type_params: &Option<Box<TsTypeParamInstantiation>>,
        file: BffFileName,
        visibility: Visibility,
    ) -> Res<Runtype> {
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

    fn get_addressed_type_from_ts_entity_name(
        &mut self,
        type_name: &TsEntityName,
        type_params: &Option<Box<TsTypeParamInstantiation>>,
        file: BffFileName,
        visibility: Visibility,
    ) -> Res<FinalAddressedType> {
        assert!(type_params.is_none(), "generic types not supported yet");
        match type_name {
            TsEntityName::Ident(ident) => {
                let addr = ModuleItemAddress::from_ident(ident, file, visibility);
                let addressed = self.get_addressed_type(&addr, &ident.span)?;
                match addressed {
                    AddressedType::TsType {
                        t: _,
                        file_name: original_file,
                        name,
                    } => Ok(FinalAddressedType::TsType {
                        file_name: original_file,
                        name,
                    }),
                }
            }
            TsEntityName::TsQualifiedName(ts_qualified_name) => {
                let type_addressed = self
                    .get_adressed_qualified_type_from_entity_name(&ts_qualified_name.left, file)?;
                match type_addressed {
                    AddressedQualifiedType::StarImport(bff_file_name) => {
                        Ok(FinalAddressedType::ItemOfStar {
                            file_name: bff_file_name,
                            key: ts_qualified_name.right.sym.to_string(),
                        })
                    }
                }
            }
        }
    }

    fn extract_final_addressed_type(
        &mut self,
        fat: &FinalAddressedType,
        span: &Span,
    ) -> Res<Runtype> {
        match fat {
            FinalAddressedType::TsType { file_name, name } => {
                let address = ModuleItemAddress {
                    file: file_name.clone(),
                    name: name.clone(),
                    visibility: Visibility::Export,
                };
                self.extract_addressed_type(&address, span)
            }
            FinalAddressedType::ItemOfStar { file_name, key } => {
                let address = ModuleItemAddress {
                    file: file_name.clone(),
                    name: key.clone(),
                    visibility: Visibility::Export,
                };
                self.extract_addressed_type(&address, span)
            }
        }
    }

    fn extract_type_ref_caching(
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

        assert!(type_params.is_none(), "generic types not supported yet");
        let fat =
            self.get_addressed_type_from_ts_entity_name(type_name, type_params, file, visibility)?;
        self.extract_final_addressed_type(&fat, &ty.span)
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

        assert!(type_params.is_none(), "generic types not supported yet");

        self.extract_type_from_ts_entity_name(type_name, type_params, file, visibility)
        //self.extract_type_ref_caching(ty, file, visibility)
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
                    name: i.sym.to_string(),
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
                self.extract_type(&ts_type, bff_file_name)
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
                            name: ts_qualified_name.right.sym.to_string(),
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
                    name: ts_qualified_name.right.sym.to_string(),
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
            TsTypeQueryExpr::Import(import_type) => {
                assert!(
                    import_type.type_args.is_none(),
                    "generic types not supported yet"
                );
                if let Some(resolved) = self
                    .files
                    .resolve_import(file.clone(), &import_type.arg.value)
                {
                    match &import_type.qualifier {
                        Some(ts_entity_name) => {
                            return self.extract_value_ts_entity_name(
                                &ts_entity_name,
                                resolved,
                                Visibility::Export,
                                &import_type.span,
                            );
                        }
                        None => todo!(),
                    }
                }
                todo!()
            }
        }
    }

    fn extract_ts_import_type(
        &mut self,
        import_type: &TsImportType,
        file: BffFileName,
    ) -> Res<Runtype> {
        if let Some(resolved) = self
            .files
            .resolve_import(file.clone(), &import_type.arg.value)
        {
            match &import_type.qualifier {
                Some(ts_entity_name) => {
                    return self.extract_type_from_ts_entity_name(
                        ts_entity_name,
                        &import_type.type_args,
                        resolved,
                        Visibility::Export,
                    );
                }
                None => todo!(),
            }
        };
        todo!()
    }

    fn union(&mut self, types: &[Box<TsType>], file: BffFileName) -> Res<Runtype> {
        let vs: Vec<Runtype> = types
            .iter()
            .map(|it| self.extract_type(it, file.clone()))
            .collect::<Res<_>>()?;
        Ok(Runtype::any_of(vs))
    }

    fn intersection(&mut self, types: &[Box<TsType>], file: BffFileName) -> Res<Runtype> {
        let vs: Vec<Runtype> = types
            .iter()
            .map(|it| self.extract_type(it, file.clone()))
            .collect::<Res<_>>()?;

        Ok(Runtype::all_of(vs))
    }
    fn extract_ts_type_element(
        &mut self,
        prop: &TsTypeElement,
        file: BffFileName,
    ) -> Res<(String, Optionality<Runtype>)> {
        match prop {
            TsTypeElement::TsPropertySignature(prop) => {
                let key = match &*prop.key {
                    Expr::Ident(ident) => ident.sym.to_string(),
                    Expr::Lit(Lit::Str(st)) => st.value.to_string(),
                    _ => {
                        return self.error(
                            &prop.span,
                            DiagnosticInfoMessage::PropKeyShouldBeIdent,
                            file.clone(),
                        );
                    }
                };
                match &prop.type_ann.as_ref() {
                    Some(val) => {
                        let value = self.extract_type(&val.type_ann, file.clone())?;
                        let value = if prop.optional {
                            value.optional()
                        } else {
                            value.required()
                        };
                        Ok((key, value))
                    }
                    None => self.error(
                        &prop.span,
                        DiagnosticInfoMessage::PropShouldHaveTypeAnnotation,
                        file.clone(),
                    ),
                }
            }
            TsTypeElement::TsIndexSignature(_) => self.cannot_serialize_error(
                &prop.span(),
                DiagnosticInfoMessage::IndexSignatureNonSerializableToJsonSchema,
                file.clone(),
            ),
            TsTypeElement::TsGetterSignature(_)
            | TsTypeElement::TsSetterSignature(_)
            | TsTypeElement::TsMethodSignature(_)
            | TsTypeElement::TsCallSignatureDecl(_)
            | TsTypeElement::TsConstructSignatureDecl(_) => self.cannot_serialize_error(
                &prop.span(),
                DiagnosticInfoMessage::PropertyNonSerializableToJsonSchema,
                file.clone(),
            ),
        }
    }

    fn extract_type(&mut self, ty: &TsType, file: BffFileName) -> Res<Runtype> {
        match ty {
            TsType::TsTypeRef(ts_type_ref) => {
                self.extract_type_ref(ts_type_ref, file, Visibility::Local)
            }
            TsType::TsKeywordType(ts_keyword_type) => self.extract_ts_keyword_type(ts_keyword_type),
            TsType::TsTypeQuery(ts_type_query) => {
                self.extract_type_query(ts_type_query, file, Visibility::Local)
            }
            TsType::TsImportType(ts_import_type) => {
                self.extract_ts_import_type(ts_import_type, file)
            }
            TsType::TsLitType(TsLitType { lit, .. }) => match lit {
                TsLit::Number(n) => Ok(Runtype::Const(RuntypeConst::parse_f64(n.value))),
                TsLit::Str(s) => Ok(Runtype::single_string_const(&s.value)),
                TsLit::Bool(b) => Ok(Runtype::Const(RuntypeConst::Bool(b.value))),
                TsLit::BigInt(_) => Ok(Runtype::BigInt),
                TsLit::Tpl(_) => todo!(),
            },
            TsType::TsArrayType(TsArrayType { elem_type, .. }) => Ok(Runtype::Array(
                self.extract_type(elem_type, file.clone())?.into(),
            )),
            TsType::TsUnionOrIntersectionType(it) => match &it {
                TsUnionOrIntersectionType::TsUnionType(TsUnionType { types, .. }) => {
                    self.union(types, file)
                }
                TsUnionOrIntersectionType::TsIntersectionType(TsIntersectionType {
                    types, ..
                }) => self.intersection(types, file),
            },
            TsType::TsParenthesizedType(TsParenthesizedType { type_ann, .. }) => {
                self.extract_type(type_ann, file)
            }
            TsType::TsTupleType(TsTupleType { elem_types, .. }) => {
                let mut prefix_items = vec![];
                let mut items = None;
                for it in elem_types {
                    if let TsType::TsRestType(TsRestType { type_ann, .. }) = &*it.ty {
                        if items.is_some() {
                            return self.cannot_serialize_error(
                                &it.span,
                                DiagnosticInfoMessage::DuplicatedRestNonSerializableToJsonSchema,
                                file.clone(),
                            );
                        }
                        let ann = match self.extract_type(type_ann, file.clone())? {
                            Runtype::Array(items) => *items,
                            _ => todo!(),
                        };
                        items = Some(ann.into());
                    } else {
                        let ty_schema = self.extract_type(&it.ty, file.clone())?;
                        prefix_items.push(ty_schema);
                    }
                }
                Ok(Runtype::Tuple {
                    prefix_items,
                    items,
                })
            }
            TsType::TsTypeLit(TsTypeLit { members, .. }) => Ok(Runtype::object(
                members
                    .iter()
                    .map(|prop| self.extract_ts_type_element(prop, file.clone()))
                    .collect::<Res<_>>()?,
            )),

            TsType::TsIndexedAccessType(_ts_indexed_access_type) => todo!(),
            TsType::TsMappedType(_ts_mapped_type) => todo!(),
            TsType::TsConditionalType(_ts_conditional_type) => todo!(),
            TsType::TsTypeOperator(TsTypeOperator {
                span: _,
                op,
                type_ann: _,
            }) => match op {
                TsTypeOperatorOp::KeyOf => todo!(),
                TsTypeOperatorOp::Unique => todo!(),
                TsTypeOperatorOp::ReadOnly => todo!(),
            },

            TsType::TsOptionalType(TsOptionalType { span, .. }) => self.error(
                span,
                DiagnosticInfoMessage::OptionalTypeIsNotSupported,
                file,
            ),
            TsType::TsThisType(TsThisType { span, .. }) => self.cannot_serialize_error(
                span,
                DiagnosticInfoMessage::ThisTypeNonSerializableToJsonSchema,
                file,
            ),
            TsType::TsFnOrConstructorType(
                TsFnOrConstructorType::TsConstructorType(TsConstructorType { span, .. })
                | TsFnOrConstructorType::TsFnType(TsFnType { span, .. }),
            ) => self.cannot_serialize_error(
                span,
                DiagnosticInfoMessage::TsFnOrConstructorTypeNonSerializableToJsonSchema,
                file,
            ),
            TsType::TsInferType(TsInferType { span, .. }) => self.cannot_serialize_error(
                span,
                DiagnosticInfoMessage::TsInferTypeNonSerializableToJsonSchema,
                file,
            ),
            TsType::TsTypePredicate(TsTypePredicate { span, .. }) => self.cannot_serialize_error(
                span,
                DiagnosticInfoMessage::TsTypePredicateNonSerializableToJsonSchema,
                file,
            ),
            TsType::TsRestType(ty) => self.error(
                &ty.span,
                DiagnosticInfoMessage::AnyhowError(
                    "should have been handled by parent node".to_string(),
                ),
                file,
            ),
        }
    }

    fn cannot_serialize_error<T>(
        &mut self,
        span: &Span,
        msg: DiagnosticInfoMessage,
        file_name: BffFileName,
    ) -> Res<T> {
        let cause = self.build_error(span, msg, file_name);

        Err(Diagnostic {
            parent_big_message: Some(DiagnosticParentMessage::CannotConvertToSchema),
            cause,
            related_information: None,
        }
        .into())
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
                        let schema = match self.extract_type(ann, self.parser_file.clone()) {
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
