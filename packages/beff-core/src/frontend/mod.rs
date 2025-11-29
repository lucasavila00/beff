use crate::NamedSchema;
use crate::subtyping::ToSemType;
use crate::subtyping::semtype::{SemType, SemTypeContext, SemTypeOps};
use crate::subtyping::to_schema::semtype_to_runtypes;
use crate::{
    BeffUserSettings, BffFileName, FileManager, ImportReference, ModuleItemAddress, ParsedModule,
    RuntypeName, SymbolExport, SymbolExportDefault, Visibility,
    ast::runtype::{CustomFormat, Optionality, Runtype, RuntypeConst, TplLitType, TplLitTypeItem},
    diag::{
        Diagnostic, DiagnosticInfoMessage, DiagnosticInformation, DiagnosticParentMessage, Location,
    },
    parser_extractor::BuiltDecoder,
};
use anyhow::{Result, anyhow};
use std::{collections::HashMap, rc::Rc};
use swc_common::{Span, Spanned};
use swc_ecma_ast::{
    Expr, Ident, Lit, Prop, PropName, PropOrSpread, Str, TsArrayType, TsCallSignatureDecl,
    TsConstructSignatureDecl, TsConstructorType, TsEntityName, TsEnumDecl, TsFnOrConstructorType,
    TsFnType, TsGetterSignature, TsImportType, TsIndexSignature, TsIndexedAccessType, TsInferType,
    TsInterfaceDecl, TsIntersectionType, TsKeywordType, TsKeywordTypeKind, TsLit, TsLitType,
    TsMethodSignature, TsOptionalType, TsParenthesizedType, TsPropertySignature, TsQualifiedName,
    TsRestType, TsSetterSignature, TsThisType, TsTplLitType, TsTupleType, TsType, TsTypeAliasDecl,
    TsTypeElement, TsTypeLit, TsTypeOperator, TsTypeOperatorOp, TsTypeParamInstantiation,
    TsTypePredicate, TsTypeQuery, TsTypeQueryExpr, TsTypeRef, TsUnionOrIntersectionType,
    TsUnionType,
};

pub struct FrontendCtx<'a, R: FileManager> {
    pub files: &'a mut R,
    pub settings: &'a BeffUserSettings,

    pub parser_file: BffFileName,
    pub errors: Vec<Diagnostic>,
    pub partial_validators: HashMap<RuntypeName, Option<Runtype>>,

    pub counter: usize,
}

#[derive(Debug)]
pub enum AddressedType {
    TsType {
        t: Rc<TsTypeAliasDecl>,
        address: ModuleItemAddress,
    },
    TsInterface {
        t: Rc<TsInterfaceDecl>,
        address: ModuleItemAddress,
    },
    TsEnum {
        t: Rc<TsEnumDecl>,
        address: ModuleItemAddress,
    },
}
impl AddressedType {
    fn addr(&self) -> ModuleItemAddress {
        match self {
            AddressedType::TsType { t: _, address } => address.clone(),
            AddressedType::TsInterface { t: _, address } => address.clone(),
            AddressedType::TsEnum { t: _, address } => address.clone(),
        }
    }
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

#[derive(Debug)]
pub enum FinalTypeAddress {
    TsType {
        addressed_type: AddressedType,
        address: ModuleItemAddress,
    },
    SomethingOfStarOfFile {
        address: ModuleItemAddress,
    },
}

impl FinalTypeAddress {
    pub fn addr(&self) -> &ModuleItemAddress {
        match self {
            FinalTypeAddress::TsType {
                addressed_type: _,
                address,
            } => address,
            FinalTypeAddress::SomethingOfStarOfFile { address } => address,
        }
    }
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

    fn get_addressed_item_from_local_ts_type(
        &mut self,
        ts_type: &Rc<TsTypeAliasDecl>,
        file: BffFileName,
        name: String,
    ) -> Res<U>;

    fn get_addressed_item_from_local_ts_enum(
        &mut self,
        ts_enum: &Rc<TsEnumDecl>,
        file: BffFileName,
        name: String,
    ) -> Res<U>;

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
                if let Some(ts_type) = parsed_module.locals.type_aliases.get(&addr.name) {
                    return Ok(self.get_addressed_item_from_local_ts_type(
                        ts_type,
                        addr.file.clone(),
                        addr.name.clone(),
                    )?);
                }

                if let Some(enum_) = parsed_module.locals.enums.get(&addr.name) {
                    return Ok(self.get_addressed_item_from_local_ts_enum(
                        enum_,
                        addr.file.clone(),
                        addr.name.clone(),
                    )?);
                }

                if let Some(interface) = parsed_module.locals.interfaces.get(&addr.name) {
                    // return Ok(AddressedType::TsInterface(
                    //     interface.clone(),
                    //     addr.file.clone(),
                    // ));
                    todo!()
                }

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
                    address: ModuleItemAddress {
                        file: original_file.clone(),
                        name: name.clone(),
                        visibility: Visibility::Export,
                    },
                });
            }
            SymbolExport::TsInterfaceDecl { .. } => {
                // return Ok(AddressedType::TsInterfaceDecl(
                //     decl.clone(),
                //     original_file.clone(),
                // ));
                todo!()
            }
            SymbolExport::TsEnumDecl { .. } => {
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

    fn get_addressed_item_from_local_ts_type(
        &mut self,
        ts_type: &Rc<TsTypeAliasDecl>,
        file: BffFileName,
        name: String,
    ) -> Res<AddressedType> {
        Ok(AddressedType::TsType {
            t: ts_type.clone(),
            address: ModuleItemAddress {
                file,
                name,
                visibility: Visibility::Local,
            },
        })
    }

    fn handle_import_star(&mut self, _file_name: BffFileName, _span: &Span) -> Res<AddressedType> {
        // should have called get_addressed_qualified_type
        todo!()
    }

    fn get_addressed_item_from_local_ts_enum(
        &mut self,
        ts_enum: &Rc<TsEnumDecl>,
        file: BffFileName,
        name: String,
    ) -> Res<AddressedType> {
        Ok(AddressedType::TsEnum {
            t: ts_enum.clone(),
            address: ModuleItemAddress {
                file,
                name,
                visibility: Visibility::Local,
            },
        })
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

    fn get_addressed_item_from_local_ts_type(
        &mut self,
        _ts_type: &Rc<TsTypeAliasDecl>,
        _file: BffFileName,
        _name: String,
    ) -> Res<AddressedQualifiedType> {
        todo!()
    }

    fn handle_import_star(
        &mut self,
        file_name: BffFileName,
        _span: &Span,
    ) -> Res<AddressedQualifiedType> {
        Ok(AddressedQualifiedType::StarImport(file_name))
    }

    fn get_addressed_item_from_local_ts_enum(
        &mut self,
        ts_enum: &Rc<TsEnumDecl>,
        file: BffFileName,
        name: String,
    ) -> Res<AddressedQualifiedType> {
        todo!()
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
            partial_validators: HashMap::new(),
            counter: 0,
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
    fn box_error(
        &mut self,
        span: &Span,
        msg: DiagnosticInfoMessage,
        file: BffFileName,
    ) -> Box<Diagnostic> {
        let err = self.build_error(span, msg, file);
        err.to_diag(None).into()
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

    fn extract_enum_decl(&mut self, typ: &TsEnumDecl, file: BffFileName) -> Res<Runtype> {
        let mut values = vec![];

        for member in &typ.members {
            match &member.init {
                Some(init) => {
                    let expr_ty = self.typeof_expr(init, true, file.clone())?;
                    values.push(expr_ty);
                }
                None => {
                    return self.cannot_serialize_error(
                        &typ.span,
                        DiagnosticInfoMessage::EnumMemberNoInit,
                        file,
                    )?;
                }
            }
        }

        Ok(Runtype::any_of(values))
    }

    fn extract_addressed_type(&mut self, address: &ModuleItemAddress, span: &Span) -> Res<Runtype> {
        let addressed_type = self.get_addressed_type(address, span)?;
        match addressed_type {
            AddressedType::TsType { t: decl, address } => {
                assert!(
                    decl.type_params.is_none(),
                    "generic types not supported yet"
                );
                let runtype = self.extract_type(&decl.type_ann, address.file.clone())?;
                Ok(runtype)
            }
            AddressedType::TsInterface { t, address } => {
                assert!(t.type_params.is_none(), "generic types not supported yet");
                todo!()
            }
            AddressedType::TsEnum { t, address } => {
                let runtype = self.extract_enum_decl(&t, address.file.clone())?;
                Ok(runtype)
            }
        }
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

    fn get_final_address_from_ts_entity_name(
        &mut self,
        type_name: &TsEntityName,
        type_params: &Option<Box<TsTypeParamInstantiation>>,
        file: BffFileName,
        visibility: Visibility,
    ) -> Res<FinalTypeAddress> {
        assert!(type_params.is_none(), "generic types not supported yet");
        match type_name {
            TsEntityName::Ident(ident) => {
                let addr = ModuleItemAddress::from_ident(ident, file, visibility);
                let addressed = self.get_addressed_type(&addr, &ident.span)?;
                Ok(FinalTypeAddress::TsType {
                    address: addressed.addr().clone(),
                    addressed_type: addressed,
                })
            }
            TsEntityName::TsQualifiedName(ts_qualified_name) => {
                let type_addressed = self
                    .get_adressed_qualified_type_from_entity_name(&ts_qualified_name.left, file)?;
                match type_addressed {
                    AddressedQualifiedType::StarImport(bff_file_name) => {
                        Ok(FinalTypeAddress::SomethingOfStarOfFile {
                            address: ModuleItemAddress {
                                file: bff_file_name,
                                name: ts_qualified_name.right.sym.to_string(),
                                visibility: Visibility::Export,
                            },
                        })
                    }
                }
            }
        }
    }
    fn insert_definition(&mut self, addr: RuntypeName, schema: Runtype) -> Res<Runtype> {
        if let Some(Some(v)) = self.partial_validators.get(&addr) {
            assert_eq!(v, &schema);
        }
        self.partial_validators.insert(addr.clone(), Some(schema));
        Ok(Runtype::Ref(addr))
    }

    fn get_string_with_format(
        &mut self,
        type_params: &Option<Box<TsTypeParamInstantiation>>,
        span: &Span,
        file: BffFileName,
    ) -> Res<Runtype> {
        let r = type_params.as_ref().and_then(|it| it.params.split_first());

        if let Some((head, rest)) = r {
            if rest.is_empty() {
                if let TsType::TsLitType(TsLitType {
                    lit: TsLit::Str(Str { value, .. }),
                    ..
                }) = &**head
                {
                    let val_str = value.to_string();
                    if self.settings.string_formats.contains(&val_str) {
                        return Ok(Runtype::StringWithFormat(CustomFormat(val_str, vec![])));
                    } else {
                        return self.error(
                            span,
                            DiagnosticInfoMessage::CustomStringIsNotRegistered,
                            file.clone(),
                        );
                    }
                }
            }
        }
        self.error(
            span,
            DiagnosticInfoMessage::InvalidUsageOfStringFormatTypeParameter,
            file,
        )
    }
    fn get_string_format_base_formats(
        &mut self,
        schema: &Runtype,
        span: &Span,
        file: BffFileName,
    ) -> Res<(String, Vec<String>)> {
        match schema {
            Runtype::StringWithFormat(CustomFormat(first, rest)) => {
                Ok((first.clone(), rest.clone()))
            }
            Runtype::Ref(r) => {
                let v = self.partial_validators.get(r);

                let v = v.and_then(|it| it.clone());
                if let Some(v) = v {
                    self.get_string_format_base_formats(&v, span, file)
                } else {
                    self.error(
                        span,
                        DiagnosticInfoMessage::CouldNotFindBaseOfStringFormatExtends,
                        file,
                    )
                }
            }
            _ => self.error(
                span,
                DiagnosticInfoMessage::BaseOfStringFormatExtendsShouldBeStringFormat,
                file,
            ),
        }
    }

    fn get_string_format_extends(
        &mut self,
        type_params: &Option<Box<TsTypeParamInstantiation>>,
        span: &Span,
        file: BffFileName,
    ) -> Res<Runtype> {
        if let Some(type_params) = type_params {
            if let [base, next_str] = type_params.params.as_slice() {
                if let TsType::TsLitType(TsLitType {
                    lit: TsLit::Str(Str { value, .. }),
                    ..
                }) = &**next_str
                {
                    let next_str = value.to_string();
                    if self.settings.string_formats.contains(&next_str) {
                        let base = self.extract_type(base, file.clone())?;

                        let (first, mut rest) =
                            self.get_string_format_base_formats(&base, span, file.clone())?;
                        rest.push(next_str);
                        return Ok(Runtype::StringWithFormat(CustomFormat(first, rest)));
                    } else {
                        return self.error(
                            span,
                            DiagnosticInfoMessage::CustomStringIsNotRegistered,
                            file.clone(),
                        );
                    }
                }
            }
        }
        self.error(
            span,
            DiagnosticInfoMessage::InvalidUsageOfStringFormatExtendsTypeParameter,
            file,
        )
    }
    fn get_number_with_format(
        &mut self,
        type_params: &Option<Box<TsTypeParamInstantiation>>,
        span: &Span,
        file: BffFileName,
    ) -> Res<Runtype> {
        let r = type_params.as_ref().and_then(|it| it.params.split_first());

        if let Some((head, rest)) = r {
            if rest.is_empty() {
                if let TsType::TsLitType(TsLitType {
                    lit: TsLit::Str(Str { value, .. }),
                    ..
                }) = &**head
                {
                    let val_str = value.to_string();
                    if self.settings.number_formats.contains(&val_str) {
                        return Ok(Runtype::NumberWithFormat(CustomFormat(val_str, vec![])));
                    } else {
                        return self.error(
                            span,
                            DiagnosticInfoMessage::CustomNumberIsNotRegistered,
                            file,
                        );
                    }
                }
            }
        }
        self.error(
            span,
            DiagnosticInfoMessage::InvalidUsageOfNumberFormatTypeParameter,
            file,
        )
    }
    fn get_number_format_base_formats(
        &mut self,
        schema: &Runtype,
        span: &Span,
        file: BffFileName,
    ) -> Res<(String, Vec<String>)> {
        match schema {
            Runtype::NumberWithFormat(CustomFormat(first, rest)) => {
                Ok((first.clone(), rest.clone()))
            }
            Runtype::Ref(r) => {
                let v = self.partial_validators.get(r);

                let v = v.and_then(|it| it.clone());
                if let Some(v) = v {
                    self.get_number_format_base_formats(&v, span, file.clone())
                } else {
                    self.error(
                        span,
                        DiagnosticInfoMessage::CouldNotFindBaseOfNumberFormatExtends,
                        file.clone(),
                    )
                }
            }
            _ => self.error(
                span,
                DiagnosticInfoMessage::BaseOfNumberFormatExtendsShouldBeNumberFormat,
                file.clone(),
            ),
        }
    }
    fn get_number_format_extends(
        &mut self,
        type_params: &Option<Box<TsTypeParamInstantiation>>,
        span: &Span,
        file: BffFileName,
    ) -> Res<Runtype> {
        if let Some(type_params) = type_params {
            if let [base, next_str] = type_params.params.as_slice() {
                if let TsType::TsLitType(TsLitType {
                    lit: TsLit::Str(Str { value, .. }),
                    ..
                }) = &**next_str
                {
                    let next_str = value.to_string();
                    if self.settings.number_formats.contains(&next_str) {
                        let base = self.extract_type(base, file.clone())?;

                        let (first, mut rest) =
                            self.get_number_format_base_formats(&base, span, file.clone())?;
                        rest.push(next_str);
                        return Ok(Runtype::NumberWithFormat(CustomFormat(first, rest)));
                    } else {
                        return self.error(
                            span,
                            DiagnosticInfoMessage::CustomNumberIsNotRegistered,
                            file.clone(),
                        );
                    }
                }
            }
        }
        self.error(
            span,
            DiagnosticInfoMessage::InvalidUsageOfNumberFormatExtendsTypeParameter,
            file.clone(),
        )
    }

    fn extract_type_from_ts_entity_name(
        &mut self,
        type_name: &TsEntityName,
        type_params: &Option<Box<TsTypeParamInstantiation>>,
        file: BffFileName,
        visibility: Visibility,
    ) -> Res<Runtype> {
        if let TsEntityName::Ident(i) = type_name {
            match i.sym.to_string().as_str() {
                "Date" => return Ok(Runtype::Date),
                "ReadonlyArray" | "Array" => {
                    let type_params = type_params.as_ref().and_then(|it| it.params.split_first());
                    if let Some((ty, [])) = type_params {
                        let ty = self.extract_type(ty, file.clone())?;
                        return Ok(Runtype::Array(ty.into()));
                    }
                    return Ok(Runtype::Array(Runtype::Any.into()));
                }
                "StringFormat" => {
                    return self.get_string_with_format(type_params, &i.span, file.clone());
                }
                "StringFormatExtends" => {
                    return self.get_string_format_extends(type_params, &i.span, file.clone());
                }
                "NumberFormat" => {
                    return self.get_number_with_format(type_params, &i.span, file.clone());
                }
                "NumberFormatExtends" => {
                    return self.get_number_format_extends(type_params, &i.span, file.clone());
                }
                _ => {}
            }
        }

        assert!(type_params.is_none(), "generic types not supported yet");
        let fat = self.get_final_address_from_ts_entity_name(
            type_name,
            type_params,
            file.clone(),
            visibility,
        )?;
        let rt_name = RuntypeName::Address(fat.addr().clone());
        let found = self.partial_validators.get(&rt_name);
        if let Some(_found_in_map) = found {
            match type_params {
                Some(_) => {
                    // return an error, cannot have recursive generic types for now
                    return self.error(
                        &type_name.span(),
                        DiagnosticInfoMessage::CannotHaveRecursiveGenericTypes,
                        file,
                    );
                }
                None => {
                    return Ok(Runtype::Ref(RuntypeName::Address(fat.addr().clone())));
                }
            }
        }
        self.partial_validators.insert(rt_name.clone(), None);

        let ty = self.extract_addressed_type(&fat.addr(), &type_name.span());
        match ty {
            Ok(ty) => match type_params {
                None => self.insert_definition(rt_name.clone(), ty),
                Some(_) => {
                    // TODO: remove component?
                    // if the validators are keyed just by the address
                    // each call with different type params will overwrite the previous one
                    todo!()
                }
            },
            Err(e) => {
                self.insert_definition(rt_name, Runtype::Any)?;
                Err(e)
            }
        }
    }

    fn extract_type_ref(&mut self, ty: &TsTypeRef, file: BffFileName) -> Res<Runtype> {
        let TsTypeRef {
            type_name,
            type_params,
            span: _,
        } = ty;

        self.extract_type_from_ts_entity_name(type_name, type_params, file, Visibility::Local)
    }

    fn extract_ts_keyword_type(&mut self, ty: &TsKeywordType) -> Res<Runtype> {
        match ty.kind {
            TsKeywordTypeKind::TsStringKeyword => Ok(Runtype::String),
            TsKeywordTypeKind::TsNumberKeyword => Ok(Runtype::Number),
            TsKeywordTypeKind::TsAnyKeyword => Ok(Runtype::Any),
            TsKeywordTypeKind::TsUnknownKeyword => Ok(Runtype::Any),
            TsKeywordTypeKind::TsObjectKeyword => todo!(),
            TsKeywordTypeKind::TsBooleanKeyword => Ok(Runtype::Boolean),
            TsKeywordTypeKind::TsBigIntKeyword => Ok(Runtype::BigInt),
            TsKeywordTypeKind::TsSymbolKeyword => todo!(),
            TsKeywordTypeKind::TsVoidKeyword => Ok(Runtype::Void),
            TsKeywordTypeKind::TsUndefinedKeyword => Ok(Runtype::Undefined),
            TsKeywordTypeKind::TsNullKeyword => Ok(Runtype::Null),
            TsKeywordTypeKind::TsNeverKeyword => Ok(Runtype::Never),
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

    fn runtype_to_tpl_lit(
        &mut self,
        span: &Span,
        schema: &Runtype,
        file_name: BffFileName,
    ) -> Res<TplLitTypeItem> {
        match schema {
            Runtype::Boolean => Ok(TplLitTypeItem::Boolean),
            Runtype::String => Ok(TplLitTypeItem::String),
            Runtype::Number => Ok(TplLitTypeItem::Number),
            Runtype::AnyOf(vs) => {
                let mut acc = vec![];
                for v in vs {
                    let item = self.runtype_to_tpl_lit(span, v, file_name.clone())?;
                    acc.push(item);
                }
                Ok(TplLitTypeItem::one_of(acc))
            }
            Runtype::Ref(name) => {
                let v = self.partial_validators.get(name);
                let v = v.and_then(|it| it.clone());
                match v {
                    Some(v) => self.runtype_to_tpl_lit(span, &v, file_name.clone()),
                    None => self.error(
                        span,
                        DiagnosticInfoMessage::CannotResolveRefInJsonSchemaToTplLit,
                        file_name,
                    ),
                }
            }
            Runtype::TplLitType(it) => match it.0.as_slice() {
                [single] => Ok(single.clone()),
                _ => self.error(
                    span,
                    DiagnosticInfoMessage::NestedTplLitInJsonSchemaToTplLit,
                    file_name,
                ),
            },
            _ => self.error(
                span,
                DiagnosticInfoMessage::TplLitTypeNonStringNonNumberNonBoolean,
                file_name,
            ),
        }
    }

    fn convert_ts_tpl_lit_type_non_trivial(
        &mut self,
        it: &TsTplLitType,
        file_name: BffFileName,
    ) -> Res<Runtype> {
        let mut quasis_idx = 0;
        let mut types_idx = 0;
        let mut selecting_quasis = true;

        let mut acc: Vec<TplLitTypeItem> = vec![];
        let iter_count = it.quasis.len() + it.types.len();
        for _ in 0..iter_count {
            if selecting_quasis {
                let quasis = &it.quasis[quasis_idx];
                quasis_idx += 1;
                acc.push(TplLitTypeItem::StringConst(quasis.raw.to_string()));
                selecting_quasis = false;
            } else {
                let type_ = &it.types[types_idx];
                types_idx += 1;

                let ty = self.extract_type(type_, file_name.clone())?;
                acc.push(self.runtype_to_tpl_lit(&it.span, &ty, file_name.clone())?);

                selecting_quasis = true;
            }
        }

        Ok(Runtype::TplLitType(TplLitType(acc)))
    }

    fn convert_ts_tpl_lit_type(
        &mut self,
        it: &TsTplLitType,
        file_name: BffFileName,
    ) -> Res<Runtype> {
        if !it.types.is_empty() || it.quasis.len() != 1 {
            self.convert_ts_tpl_lit_type_non_trivial(it, file_name)
        } else {
            Ok(Runtype::single_string_const(
                &it.quasis
                    .iter()
                    .map(|it| it.raw.to_string())
                    .collect::<String>(),
            ))
        }
    }
    fn extract_union(&self, tp: Runtype) -> Result<Vec<Runtype>, DiagnosticInfoMessage> {
        match tp {
            Runtype::AnyOf(v) => {
                let mut vs = vec![];
                for item in v {
                    let extracted = self.extract_union(item)?;
                    vs.extend(extracted);
                }
                Ok(vs)
            }
            Runtype::Ref(r) => {
                let v = self.partial_validators.get(&r);
                let v = v.and_then(|it| it.clone());
                match v {
                    Some(v) => self.extract_union(v),
                    None => Err(DiagnosticInfoMessage::CannotResolveRefInExtractUnion(r)),
                }
            }
            Runtype::Never => Ok(vec![]),
            _ => Ok(vec![tp]),
        }
    }

    fn semtype_to_runtype(
        &mut self,
        access_st: Rc<SemType>,
        ctx: &mut SemTypeContext,
        span: &Span,
        file: BffFileName,
    ) -> Res<Runtype> {
        if access_st.is_empty(ctx).map_err(|e| {
            self.box_error(
                span,
                DiagnosticInfoMessage::AnyhowError(e.to_string()),
                file.clone(),
            )
        })? {
            return Ok(Runtype::Never);
        }
        let (head, tail) = semtype_to_runtypes(
            ctx,
            &access_st,
            &RuntypeName::Name("AnyName".to_string()),
            &mut self.counter,
        )
        .map_err(|any| {
            self.box_error(
                span,
                DiagnosticInfoMessage::AnyhowError(any.to_string()),
                file.clone(),
            )
        })?;
        for t in tail {
            self.insert_definition(t.name.clone(), t.schema)?;
        }
        Ok(head.schema)
    }

    fn convert_indexed_access_syntatically(
        &mut self,
        obj: &Runtype,
        index: &Runtype,
    ) -> Res<Option<Runtype>> {
        // try to resolve syntatically
        match (obj, index) {
            (Runtype::Ref(r), _) => {
                let v = self.partial_validators.get(r);

                let v = v.and_then(|it| it.clone());
                if let Some(v) = v {
                    return self.convert_indexed_access_syntatically(&v, index);
                }
            }
            (
                Runtype::Object {
                    vs,
                    indexed_properties: _,
                },
                other,
            ) => {
                if let Some(s) = other.extract_single_string_const() {
                    let v = vs.get(&s);
                    if let Some(Optionality::Required(v)) = v {
                        return Ok(Some(v.clone()));
                    }
                }
                if let Ok(u) = self.extract_union(other.clone()) {
                    let mut acc = vec![];
                    for key in u {
                        if let Some(s) = key.extract_single_string_const() {
                            let v = vs.get(&s);
                            if let Some(v) = v {
                                match v {
                                    Optionality::Optional(o) => acc.push(Runtype::AnyOf(
                                        vec![o.clone(), Runtype::Null].into_iter().collect(),
                                    )),
                                    Optionality::Required(r) => {
                                        acc.push(r.clone());
                                    }
                                }
                            } else {
                                // noop (same as pushing never)
                            }
                        } else {
                            return Ok(None);
                        }
                    }
                    return Ok(Some(Runtype::any_of(acc)));
                };
            }
            _ => {}
        }
        Ok(None)
    }
    fn validators_vec(&self) -> Vec<NamedSchema> {
        // TODO: this is very inefficient, optimize it
        let mut acc = vec![];
        for (name, schema_opt) in &self.partial_validators {
            if let Some(schema) = schema_opt {
                acc.push(NamedSchema {
                    name: name.clone(),
                    schema: schema.clone(),
                });
            }
        }
        acc
    }
    fn extract_indexed_access_type(
        &mut self,
        i: &TsIndexedAccessType,
        file: BffFileName,
    ) -> Res<Runtype> {
        let obj = self.extract_type(&i.obj_type, file.clone())?;
        let index = self.extract_type(&i.index_type, file.clone())?;

        if let Some(res) = self.convert_indexed_access_syntatically(&obj, &index)? {
            return Ok(res);
        }
        // fallback to semantic
        let mut ctx = SemTypeContext::new();

        let validators_vec = self.validators_vec();

        let obj_st = obj
            .to_sem_type(&validators_vec.iter().collect::<Vec<_>>(), &mut ctx)
            .map_err(|e| {
                self.box_error(
                    &i.span,
                    DiagnosticInfoMessage::AnyhowError(e.to_string()),
                    file.clone(),
                )
            })?;
        let idx_st = index
            .to_sem_type(&validators_vec.iter().collect::<Vec<_>>(), &mut ctx)
            .map_err(|e| {
                self.box_error(
                    &i.span,
                    DiagnosticInfoMessage::AnyhowError(e.to_string()),
                    file.clone(),
                )
            })?;

        let access_st: Rc<SemType> = ctx.indexed_access(obj_st, idx_st).map_err(|e| {
            self.box_error(
                &i.span,
                DiagnosticInfoMessage::AnyhowError(e.to_string()),
                file.clone(),
            )
        })?;
        self.semtype_to_runtype(access_st, &mut ctx, &i.span(), file.clone())
    }

    fn extract_type(&mut self, ty: &TsType, file: BffFileName) -> Res<Runtype> {
        match ty {
            TsType::TsTypeRef(ts_type_ref) => self.extract_type_ref(ts_type_ref, file),
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
                TsLit::Tpl(it) => self.convert_ts_tpl_lit_type(it, file.clone()),
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

            TsType::TsIndexedAccessType(ts_indexed_access_type) => {
                self.extract_indexed_access_type(ts_indexed_access_type, file)
            }
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
