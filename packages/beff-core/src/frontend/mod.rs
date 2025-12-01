use crate::ast::runtype::IndexedProperty;
use crate::subtyping::ToSemType;
use crate::subtyping::semtype::{SemType, SemTypeContext, SemTypeOps};
use crate::subtyping::to_schema::semtype_to_runtypes;
use crate::swc_tools::{SymbolExport, SymbolExportDefault};
use crate::{Anchor, NamedSchema, RuntypeUUID, TsBuiltIn, TypeAddress};
use crate::{
    BeffUserSettings, BffFileName, FileManager, ImportReference, ModuleItemAddress, ParsedModule,
    RuntypeName, Visibility,
    ast::runtype::{CustomFormat, Optionality, Runtype, RuntypeConst, TplLitType, TplLitTypeItem},
    diag::{DiagnosticInfoMessage, DiagnosticInformation, Location},
    parser_extractor::BuiltDecoder,
};
use anyhow::{Result, anyhow};
use std::collections::{BTreeMap, BTreeSet};
use std::rc::Rc;
use swc_common::{Span, Spanned};
use swc_ecma_ast::{
    Expr, Lit, MemberProp, Prop, PropName, PropOrSpread, TruePlusMinus, TsArrayType,
    TsCallSignatureDecl, TsConditionalType, TsConstructSignatureDecl, TsConstructorType,
    TsEntityName, TsEnumDecl, TsEnumMemberId, TsExprWithTypeArgs, TsFnOrConstructorType, TsFnType,
    TsGetterSignature, TsImportType, TsIndexSignature, TsIndexedAccessType, TsInferType,
    TsInterfaceDecl, TsIntersectionType, TsKeywordType, TsKeywordTypeKind, TsLit, TsLitType,
    TsMappedType, TsMethodSignature, TsOptionalType, TsParenthesizedType, TsPropertySignature,
    TsQualifiedName, TsRestType, TsSetterSignature, TsThisType, TsTplLitType, TsTupleType, TsType,
    TsTypeAliasDecl, TsTypeElement, TsTypeLit, TsTypeOperator, TsTypeOperatorOp,
    TsTypeParamInstantiation, TsTypePredicate, TsTypeQuery, TsTypeQueryExpr, TsTypeRef,
    TsUnionOrIntersectionType, TsUnionType,
};
type Res<T> = Result<T, Box<DiagnosticInformation>>;

pub struct FrontendCtx<'a, R: FileManager> {
    pub files: &'a mut R,
    pub settings: &'a BeffUserSettings,

    pub parser_file: BffFileName,
    pub errors: Vec<DiagnosticInformation>,
    pub partial_validators: BTreeMap<RuntypeUUID, Option<Runtype>>,
    pub recursive_generic_uuids: BTreeSet<RuntypeUUID>,

    pub counter: usize,

    pub type_application_stack: Vec<(String, Runtype)>,
}

#[derive(Debug)]
enum AddressedType {
    Type {
        t: Rc<TsTypeAliasDecl>,
        local_address: TypeAddress,
    },
    Interface {
        t: Rc<TsInterfaceDecl>,
        local_address: TypeAddress,
    },
    Enum {
        t: Rc<TsEnumDecl>,
        local_address: TypeAddress,
    },
}
impl AddressedType {
    fn type_address(&self) -> TypeAddress {
        match self {
            AddressedType::Type {
                t: _,
                local_address: address,
            } => address.clone(),
            AddressedType::Interface {
                t: _,
                local_address: address,
            } => address.clone(),
            AddressedType::Enum {
                t: _,
                local_address: address,
            } => address.clone(),
        }
    }
}

pub enum AddressedQualifiedType {
    StarImport(BffFileName),
    WillBeUsedForEnumItem {
        enum_type: Rc<TsEnumDecl>,
        address: TypeAddress,
    },
}

pub enum AddressedValue {
    ValueExpr(Rc<Expr>, BffFileName),
    TypeDecl(Rc<TsType>, BffFileName),
    Enum(Rc<TsEnumDecl>, BffFileName),
}

#[derive(Debug)]
pub enum AddressedQualifiedValue {
    StarOfFile(BffFileName),
    ValueExpr(Rc<Expr>, BffFileName),
    MemberExpr {
        base: Box<AddressedQualifiedValue>,
        member: String,
        file_name: BffFileName,
    },
}

impl AddressedQualifiedValue {
    pub fn file_name(&self) -> BffFileName {
        match self {
            AddressedQualifiedValue::StarOfFile(f) => f.clone(),
            AddressedQualifiedValue::ValueExpr(_, f) => f.clone(),
            AddressedQualifiedValue::MemberExpr { file_name, .. } => file_name.clone(),
        }
    }
}

trait TypeModuleWalker<'a, R: FileManager + 'a, U> {
    fn get_ctx<'b>(&'b mut self) -> &'b mut FrontendCtx<'a, R>;

    fn handle_import_star(&mut self, file_name: BffFileName, anchor: &Anchor) -> Res<U>;

    fn get_addressed_item_from_symbol_export(
        &mut self,
        export: &SymbolExport,
        err_anchor: &Anchor,
    ) -> Res<U>;

    fn get_addressed_item_from_local_ts_type(
        &mut self,
        ts_type: &Rc<TsTypeAliasDecl>,
        file: BffFileName,
        name: String,
        anchor: &Anchor,
    ) -> Res<U>;

    fn get_addressed_item_from_local_ts_enum(
        &mut self,
        ts_enum: &Rc<TsEnumDecl>,
        file: BffFileName,
        name: String,
    ) -> Res<U>;
    fn get_addressed_item_from_local_ts_interface(
        &mut self,
        ts_interface: &Rc<TsInterfaceDecl>,
        file: BffFileName,
        name: String,
        anchor: &Anchor,
    ) -> Res<U>;

    fn get_addressed_item_from_default_import(
        &mut self,
        file_name: BffFileName,
        err_anchor: &Anchor,
    ) -> Res<U> {
        match &self
            .get_ctx()
            .get_or_fetch_file(&file_name, err_anchor)?
            .symbol_exports
            .export_default
        {
            Some(export_default_symbol) => match export_default_symbol.as_ref() {
                SymbolExportDefault::Expr {
                    export_expr: symbol_export,
                    anchor,
                } => match symbol_export.as_ref() {
                    Expr::Ident(i) => {
                        let new_addr = ModuleItemAddress {
                            file: anchor.f.clone(),
                            name: i.sym.to_string(),
                            visibility: Visibility::Local,
                        };
                        self.get_addressed_item(&new_addr, &anchor)
                    }
                    _ => {
                        todo!()
                    }
                },
                SymbolExportDefault::Renamed { export } => {
                    self.get_addressed_item_from_symbol_export(export, err_anchor)
                }
            },
            None => todo!(),
        }
    }

    fn get_addressed_item_from_import_reference(
        &mut self,
        imported: &ImportReference,
        err_anchor: &Anchor,
    ) -> Res<U> {
        match imported {
            ImportReference::Named {
                original_name,
                file_name,
                import_statement_anchor: import_st_anchor,
            } => {
                let new_addr = ModuleItemAddress {
                    file: file_name.clone(),
                    name: (*original_name).to_string(),
                    visibility: Visibility::Export,
                };
                self.get_addressed_item(&new_addr, import_st_anchor)
            }
            ImportReference::Star {
                file_name,
                import_statement_anchor: _,
            } => self.handle_import_star(file_name.clone(), err_anchor),
            ImportReference::Default {
                file_name,
                import_statement_anchor,
            } => self
                .get_addressed_item_from_default_import(file_name.clone(), import_statement_anchor),
        }
    }

    fn get_addressed_item(&mut self, addr: &ModuleItemAddress, err_anchor: &Anchor) -> Res<U> {
        let parsed_module = self
            .get_ctx()
            .get_or_fetch_adressed_file(addr, err_anchor)?;
        match addr.visibility {
            Visibility::Local => {
                if let Some(ts_type) = parsed_module.locals.type_aliases.get(&addr.name) {
                    return self.get_addressed_item_from_local_ts_type(
                        ts_type,
                        addr.file.clone(),
                        addr.name.clone(),
                        err_anchor,
                    );
                }

                if let Some(enum_) = parsed_module.locals.enums.get(&addr.name) {
                    return self.get_addressed_item_from_local_ts_enum(
                        enum_,
                        addr.file.clone(),
                        addr.name.clone(),
                    );
                }

                if let Some(interface) = parsed_module.locals.interfaces.get(&addr.name) {
                    return self.get_addressed_item_from_local_ts_interface(
                        interface,
                        addr.file.clone(),
                        addr.name.clone(),
                        err_anchor,
                    );
                }

                if let Some(imported) = parsed_module.imports.get(&addr.name) {
                    return self.get_addressed_item_from_import_reference(imported, err_anchor);
                }

                Err(self.get_ctx().box_error(
                    err_anchor,
                    DiagnosticInfoMessage::CouldNotResolveType(addr.clone()),
                ))
            }
            Visibility::Export => {
                if addr.name == "default" {
                    return self
                        .get_addressed_item_from_default_import(addr.file.clone(), err_anchor);
                }

                if let Some(export) = parsed_module
                    .symbol_exports
                    .get_type(&addr.name, self.get_ctx().files)
                {
                    return self.get_addressed_item_from_symbol_export(&export, err_anchor);
                }

                Err(self.get_ctx().box_error(
                    err_anchor,
                    DiagnosticInfoMessage::CouldNotResolveType(addr.clone()),
                ))
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

    fn get_addressed_item_from_symbol_export(
        &mut self,
        export: &SymbolExport,
        anchor: &Anchor,
    ) -> Res<AddressedType> {
        match export {
            SymbolExport::TsType {
                decl,
                original_file,
                name,
            } => Ok(AddressedType::Type {
                t: decl.clone(),
                local_address: TypeAddress {
                    file: original_file.clone(),
                    name: name.clone(),
                },
            }),
            SymbolExport::TsInterfaceDecl {
                decl,
                original_file,
            } => Ok(AddressedType::Interface {
                t: decl.clone(),
                local_address: TypeAddress {
                    file: original_file.clone(),
                    name: decl.id.sym.to_string(),
                },
            }),
            SymbolExport::TsEnumDecl {
                decl,
                original_file,
            } => Ok(AddressedType::Enum {
                t: decl.clone(),
                local_address: TypeAddress {
                    file: original_file.clone(),
                    name: decl.id.sym.to_string(),
                },
            }),
            SymbolExport::ValueExpr { .. } => todo!(),
            SymbolExport::ExprDecl { .. } => todo!(),
            SymbolExport::StarOfOtherFile { .. } => todo!(),
            SymbolExport::SomethingOfOtherFile { something, file } => {
                let new_addr = ModuleItemAddress {
                    file: file.clone(),
                    name: something.clone(),
                    visibility: Visibility::Export,
                };
                self.get_addressed_item(&new_addr, anchor)
            }
        }
    }

    fn get_addressed_item_from_local_ts_type(
        &mut self,
        ts_type: &Rc<TsTypeAliasDecl>,
        file: BffFileName,
        name: String,
        _anchor: &Anchor,
    ) -> Res<AddressedType> {
        Ok(AddressedType::Type {
            t: ts_type.clone(),
            local_address: TypeAddress { file, name },
        })
    }

    fn handle_import_star(
        &mut self,
        _file_name: BffFileName,
        anchor: &Anchor,
    ) -> Res<AddressedType> {
        self.ctx.error(
            anchor,
            DiagnosticInfoMessage::CannotUseStarImportInTypePosition,
        )
    }

    fn get_addressed_item_from_local_ts_enum(
        &mut self,
        ts_enum: &Rc<TsEnumDecl>,
        file: BffFileName,
        name: String,
    ) -> Res<AddressedType> {
        Ok(AddressedType::Enum {
            t: ts_enum.clone(),
            local_address: TypeAddress { file, name },
        })
    }

    fn get_addressed_item_from_local_ts_interface(
        &mut self,
        ts_interface: &Rc<TsInterfaceDecl>,
        file: BffFileName,
        name: String,
        _anchor: &Anchor,
    ) -> Res<AddressedType> {
        Ok(AddressedType::Interface {
            t: ts_interface.clone(),
            local_address: TypeAddress { file, name },
        })
    }
}

impl<'a, 'b, R: FileManager> TypeModuleWalker<'a, R, AddressedQualifiedType>
    for QualifiedTypeWalker<'a, 'b, R>
{
    fn get_ctx<'c>(&'c mut self) -> &'c mut FrontendCtx<'a, R> {
        self.ctx
    }

    fn get_addressed_item_from_symbol_export(
        &mut self,
        export: &SymbolExport,
        anchor: &Anchor,
    ) -> Res<AddressedQualifiedType> {
        match export {
            SymbolExport::StarOfOtherFile { reference } => {
                self.get_addressed_item_from_import_reference(reference, anchor)
            }
            SymbolExport::TsEnumDecl {
                decl,
                original_file,
            } => self.get_addressed_item_from_local_ts_enum(
                decl,
                original_file.clone(),
                decl.id.sym.to_string(),
            ),
            SymbolExport::SomethingOfOtherFile { something, file } => {
                // TODO: test this without just the JS test
                let new_addr = ModuleItemAddress {
                    file: file.clone(),
                    name: something.clone(),
                    visibility: Visibility::Export,
                };
                self.get_addressed_item(&new_addr, anchor)
            }
            SymbolExport::TsType { .. } => todo!(),
            SymbolExport::TsInterfaceDecl { .. } => todo!(),
            SymbolExport::ValueExpr { .. } => todo!(),
            SymbolExport::ExprDecl { .. } => todo!(),
        }
    }

    fn get_addressed_item_from_local_ts_type(
        &mut self,
        _ts_type: &Rc<TsTypeAliasDecl>,
        _file: BffFileName,
        _name: String,
        anchor: &Anchor,
    ) -> Res<AddressedQualifiedType> {
        Err(self.get_ctx().box_error(
            &anchor,
            DiagnosticInfoMessage::CannotUseTypeInQualifiedTypePosition,
        ))
    }

    fn handle_import_star(
        &mut self,
        file_name: BffFileName,
        _anchor: &Anchor,
    ) -> Res<AddressedQualifiedType> {
        Ok(AddressedQualifiedType::StarImport(file_name))
    }

    fn get_addressed_item_from_local_ts_enum(
        &mut self,
        ts_enum: &Rc<TsEnumDecl>,
        file: BffFileName,
        name: String,
    ) -> Res<AddressedQualifiedType> {
        Ok(AddressedQualifiedType::WillBeUsedForEnumItem {
            enum_type: ts_enum.clone(),
            address: TypeAddress { file, name },
        })
    }

    fn get_addressed_item_from_local_ts_interface(
        &mut self,
        _ts_interface: &Rc<TsInterfaceDecl>,
        _file: BffFileName,
        _name: String,
        anchor: &Anchor,
    ) -> Res<AddressedQualifiedType> {
        Err(self.get_ctx().box_error(
            &anchor,
            DiagnosticInfoMessage::CannotUseInterfaceInQualifiedTypePosition,
        ))
    }
}

trait ValueModuleWalker<'a, R: FileManager + 'a, U> {
    fn get_ctx<'b>(&'b mut self) -> &'b mut FrontendCtx<'a, R>;

    fn get_addressed_item_from_symbol_export(
        &mut self,
        exports: &SymbolExport,
        anchor: &Anchor,
    ) -> Res<U>;
    fn handle_symbol_expr(&mut self, symbol_export: &Rc<Expr>, file_name: &BffFileName) -> Res<U>;
    fn handle_symbol_enum(
        &mut self,
        symbol_export: &Rc<TsEnumDecl>,
        file_name: &BffFileName,
    ) -> Res<U>;

    fn handle_symbol_expr_decl(
        &mut self,
        symbol_export: &Rc<TsType>,
        file_name: &BffFileName,
    ) -> Res<U>;
    fn handle_import_star(&mut self, file_name: BffFileName, anchor: &Anchor) -> Res<U>;

    fn get_addressed_item_from_default_import(
        &mut self,
        file_name: BffFileName,
        anchor: &Anchor,
    ) -> Res<U> {
        match &self
            .get_ctx()
            .get_or_fetch_file(&file_name, anchor)?
            .symbol_exports
            .export_default
        {
            Some(export_default_symbol) => match export_default_symbol.as_ref() {
                SymbolExportDefault::Expr {
                    export_expr: symbol_export,
                    anchor,
                } => match symbol_export.as_ref() {
                    Expr::Ident(i) => {
                        let new_addr = ModuleItemAddress {
                            file: anchor.f.clone(),
                            name: i.sym.to_string(),
                            visibility: Visibility::Local,
                        };
                        self.get_addressed_item(&new_addr, anchor)
                    }
                    _ => self.handle_symbol_expr(&symbol_export.clone(), &anchor.f),
                },
                SymbolExportDefault::Renamed { export } => {
                    self.get_addressed_item_from_symbol_export(export, anchor)
                }
            },
            None => self.get_ctx().error(
                anchor,
                DiagnosticInfoMessage::CouldNotResolveValue(ModuleItemAddress {
                    file: file_name,
                    name: "default".to_string(),
                    visibility: Visibility::Export,
                }),
            ),
        }
    }
    fn get_addressed_item_from_import_reference(
        &mut self,
        imported: &ImportReference,
        anchor: &Anchor,
    ) -> Res<U> {
        match imported {
            ImportReference::Named {
                original_name,
                file_name,
                import_statement_anchor: import_st_anchor,
            } => {
                let new_addr = ModuleItemAddress {
                    file: file_name.clone(),
                    name: (*original_name).to_string(),
                    visibility: Visibility::Export,
                };
                self.get_addressed_item(&new_addr, import_st_anchor)
            }
            ImportReference::Star {
                file_name,
                import_statement_anchor: _,
            } => self.handle_import_star(file_name.clone(), anchor),
            ImportReference::Default {
                file_name,
                import_statement_anchor,
            } => self
                .get_addressed_item_from_default_import(file_name.clone(), import_statement_anchor),
        }
    }
    fn get_addressed_item(&mut self, addr: &ModuleItemAddress, anchor: &Anchor) -> Res<U> {
        let parsed_module = self.get_ctx().get_or_fetch_adressed_file(addr, anchor)?;
        match addr.visibility {
            Visibility::Local => {
                if let Some(imported) = parsed_module.imports.get(&addr.name) {
                    return self.get_addressed_item_from_import_reference(imported, anchor);
                }
                if let Some(expr) = parsed_module.locals.exprs.get(&addr.name) {
                    return self.handle_symbol_expr(expr, &addr.file);
                }
                if let Some(enum_) = parsed_module.locals.enums.get(&addr.name) {
                    return self.handle_symbol_enum(enum_, &addr.file);
                }
                if let Some(decl_expr) = parsed_module.locals.exprs_decls.get(&addr.name) {
                    return self.handle_symbol_expr_decl(decl_expr, &addr.file);
                }
                if let Some(imported) = parsed_module.imports.get(&addr.name) {
                    match imported.as_ref() {
                        ImportReference::Named {
                            original_name,
                            file_name,
                            import_statement_anchor: import_st_anchor,
                        } => {
                            let new_addr = ModuleItemAddress {
                                file: file_name.clone(),
                                name: (*original_name).to_string(),
                                visibility: Visibility::Export,
                            };
                            return self.get_addressed_item(&new_addr, import_st_anchor);
                        }
                        ImportReference::Star { .. } => {
                            todo!()
                        }
                        ImportReference::Default {
                            file_name,
                            import_statement_anchor,
                        } => {
                            return self.get_addressed_item_from_default_import(
                                file_name.clone(),
                                import_statement_anchor,
                            );
                        }
                    }
                }

                self.get_ctx().error(
                    anchor,
                    DiagnosticInfoMessage::CouldNotResolveValue(addr.clone()),
                )
            }
            Visibility::Export => {
                if addr.name == "default" {
                    return self.get_addressed_item_from_default_import(addr.file.clone(), anchor);
                }

                if let Some(exports) = parsed_module
                    .symbol_exports
                    .get_value(&addr.name, self.get_ctx().files)
                {
                    return self.get_addressed_item_from_symbol_export(&exports, anchor);
                }

                self.get_ctx().error(
                    anchor,
                    DiagnosticInfoMessage::CouldNotResolveValue(addr.clone()),
                )
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
        anchor: &Anchor,
    ) -> Res<AddressedValue> {
        match exports {
            SymbolExport::TsType { .. } | SymbolExport::TsInterfaceDecl { .. } => todo!(),
            SymbolExport::TsEnumDecl {
                decl,
                original_file,
            } => Ok(AddressedValue::Enum(decl.clone(), original_file.clone())),
            SymbolExport::ValueExpr {
                expr,
                original_file,
                span: _,
                name: _,
            } => Ok(AddressedValue::ValueExpr(
                expr.clone(),
                original_file.clone(),
            )),
            SymbolExport::ExprDecl {
                name: _,
                span: _,
                original_file,
                ty,
            } => Ok(AddressedValue::TypeDecl(ty.clone(), original_file.clone())),

            SymbolExport::StarOfOtherFile { .. } => {
                // star of other file should be already resolved by the "get_value" function
                todo!()
            }
            SymbolExport::SomethingOfOtherFile { something, file } => {
                let new_addr = ModuleItemAddress {
                    file: file.clone(),
                    name: something.clone(),
                    visibility: Visibility::Export,
                };
                self.get_addressed_item(&new_addr, anchor)
            }
        }
    }

    fn handle_symbol_expr(
        &mut self,
        symbol_export: &Rc<Expr>,
        file_name: &BffFileName,
    ) -> Res<AddressedValue> {
        Ok(AddressedValue::ValueExpr(
            symbol_export.clone(),
            file_name.clone(),
        ))
    }

    fn handle_symbol_expr_decl(
        &mut self,
        symbol_export: &Rc<TsType>,
        file_name: &BffFileName,
    ) -> Res<AddressedValue> {
        Ok(AddressedValue::TypeDecl(
            symbol_export.clone(),
            file_name.clone(),
        ))
    }

    fn handle_import_star(
        &mut self,
        _file_name: BffFileName,
        anchor: &Anchor,
    ) -> Res<AddressedValue> {
        self.ctx.error(
            anchor,
            DiagnosticInfoMessage::CannotUseStarImportInValuePosition,
        )
    }

    fn handle_symbol_enum(
        &mut self,
        symbol_export: &Rc<TsEnumDecl>,
        file_name: &BffFileName,
    ) -> Res<AddressedValue> {
        Ok(AddressedValue::Enum(
            symbol_export.clone(),
            file_name.clone(),
        ))
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
        anchor: &Anchor,
    ) -> Res<AddressedQualifiedValue> {
        match exports {
            SymbolExport::StarOfOtherFile { reference } => {
                self.get_addressed_item_from_import_reference(reference.as_ref(), anchor)
            }
            SymbolExport::TsType { .. } => todo!(),
            SymbolExport::TsInterfaceDecl { .. } => todo!(),
            SymbolExport::TsEnumDecl { .. } => todo!(),
            SymbolExport::ValueExpr {
                expr,
                name: _,
                span: _,
                original_file,
            } => Ok(AddressedQualifiedValue::ValueExpr(
                expr.clone(),
                original_file.clone(),
            )),
            SymbolExport::ExprDecl { .. } => todo!(),
            SymbolExport::SomethingOfOtherFile { .. } => todo!(),
        }
    }

    fn handle_symbol_expr(
        &mut self,
        symbol_export: &Rc<Expr>,
        file_name: &BffFileName,
    ) -> Res<AddressedQualifiedValue> {
        Ok(AddressedQualifiedValue::ValueExpr(
            symbol_export.clone(),
            file_name.clone(),
        ))
    }

    fn handle_symbol_expr_decl(
        &mut self,
        _symbol_export: &Rc<TsType>,
        _file_name: &BffFileName,
    ) -> Res<AddressedQualifiedValue> {
        todo!()
    }

    fn handle_import_star(
        &mut self,
        file_name: BffFileName,
        _anchor: &Anchor,
    ) -> Res<AddressedQualifiedValue> {
        Ok(AddressedQualifiedValue::StarOfFile(file_name))
    }

    fn handle_symbol_enum(
        &mut self,
        _symbol_export: &Rc<TsEnumDecl>,
        _file_name: &BffFileName,
    ) -> Res<AddressedQualifiedValue> {
        todo!()
    }
}

impl<'a, R: FileManager> FrontendCtx<'a, R> {
    pub fn new(files: &'a mut R, parser_file: BffFileName, settings: &'a BeffUserSettings) -> Self {
        FrontendCtx {
            files,
            parser_file,
            settings,
            errors: vec![],
            partial_validators: BTreeMap::new(),
            counter: 0,

            type_application_stack: vec![],
            recursive_generic_uuids: BTreeSet::new(),
        }
    }

    fn build_error(&self, anchor: &Anchor, msg: DiagnosticInfoMessage) -> DiagnosticInformation {
        let file_content = self.files.get_existing_file(&anchor.f);
        Location::build(file_content, &anchor.s, &anchor.f).to_info(msg)
    }
    fn push_error(&mut self, anchor: &Anchor, msg: DiagnosticInfoMessage) {
        self.errors.push(self.build_error(anchor, msg));
    }

    fn anyhow_error<T>(&mut self, anchor: &Anchor, msg: DiagnosticInfoMessage) -> Result<T> {
        let e = anyhow!("{:?}", &msg);
        self.push_error(anchor, msg);
        Err(e)
    }

    fn error<T>(&mut self, anchor: &Anchor, msg: DiagnosticInfoMessage) -> Res<T> {
        let e = self.build_error(anchor, msg);
        Err(Box::new(e))
    }
    fn box_error(
        &mut self,
        anchor: &Anchor,
        msg: DiagnosticInfoMessage,
    ) -> Box<DiagnosticInformation> {
        let err = self.build_error(anchor, msg);
        err.into()
    }

    fn get_or_fetch_adressed_file(
        &mut self,
        addr: &ModuleItemAddress,
        anchor: &Anchor,
    ) -> Res<Rc<ParsedModule>> {
        let parsed_module = self.files.get_or_fetch_file(&addr.file).ok_or_else(|| {
            Box::new(self.build_error(
                anchor,
                DiagnosticInfoMessage::CouldNotResolveFile(addr.clone()),
            ))
        })?;
        Ok(parsed_module)
    }
    fn get_or_fetch_file(
        &mut self,
        file: &BffFileName,
        err_anchor: &Anchor,
    ) -> Res<Rc<ParsedModule>> {
        let parsed_module = self.files.get_or_fetch_file(file).ok_or_else(|| {
            Box::new(self.build_error(
                err_anchor,
                DiagnosticInfoMessage::CannotFindFileWhenConvertingToSchema(file.clone()),
            ))
        })?;
        Ok(parsed_module)
    }

    fn get_addressed_type(
        &mut self,
        addr: &ModuleItemAddress,
        anchor: &Anchor,
    ) -> Res<AddressedType> {
        let mut walker = TypeWalker { ctx: self };
        walker.get_addressed_item(addr, anchor)
    }

    fn get_addressed_qualified_type(
        &mut self,
        addr: &ModuleItemAddress,
        anchor: &Anchor,
    ) -> Res<AddressedQualifiedType> {
        let mut walker = QualifiedTypeWalker { ctx: self };
        walker.get_addressed_item(addr, anchor)
    }

    fn get_addressed_value(
        &mut self,
        addr: &ModuleItemAddress,
        anchor: &Anchor,
    ) -> Res<AddressedValue> {
        let mut walker = ValueWalker { ctx: self };
        walker.get_addressed_item(addr, anchor)
    }

    fn get_addressed_qualified_value(
        &mut self,
        addr: &ModuleItemAddress,
        anchor: &Anchor,
    ) -> Res<AddressedQualifiedValue> {
        let mut walker = QaulifiedValueWalker { ctx: self };
        walker.get_addressed_item(addr, anchor)
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
                    let anchor = Anchor {
                        f: file.clone(),
                        s: member.span,
                    };
                    return self.error(&anchor, DiagnosticInfoMessage::EnumMemberNoInit)?;
                }
            }
        }

        Ok(Runtype::any_of(values))
    }
    fn extract_object_from_runtype(
        &mut self,
        obj: &Runtype,
        anchor: &Anchor,
    ) -> Res<BTreeMap<String, Optionality<Runtype>>> {
        match obj {
            Runtype::Object {
                vs,
                indexed_properties,
            } => match indexed_properties.is_none() {
                true => Ok(vs.clone()),
                false => self.error(&anchor, DiagnosticInfoMessage::RestFoundOnExtractObject),
            },
            Runtype::Ref(r) => {
                let map = self
                    .partial_validators
                    .get(r)
                    .and_then(|it| it.as_ref())
                    .cloned();
                match map {
                    Some(schema) => self.extract_object_from_runtype(&schema, anchor),
                    None => self.error(
                        &anchor,
                        DiagnosticInfoMessage::ShouldHaveObjectAsTypeArgument,
                    ),
                }
            }
            Runtype::AllOf(vs) => {
                let mut acc = BTreeMap::new();

                for v in vs {
                    let extracted = self.extract_object_from_runtype(v, anchor)?;

                    // check that if items have the same key, they have the same value

                    for (k, v) in &extracted {
                        if let Some(existing) = acc.get(k)
                            && existing != v
                        {
                            return self.error(
                                &anchor,
                                DiagnosticInfoMessage::ObjectHasConflictingKeyValueInIntersection,
                            );
                        }
                    }

                    acc.extend(extracted);
                }

                Ok(acc)
            }
            _ => self.error(
                &anchor,
                DiagnosticInfoMessage::ShouldHaveObjectAsTypeArgument,
            ),
        }
    }
    fn extract_interface_extends(
        &mut self,
        typ: &Vec<TsExprWithTypeArgs>,
        file: BffFileName,
    ) -> Res<Vec<Runtype>> {
        let mut vs = vec![];

        for it in typ {
            let anchor = Anchor {
                f: file.clone(),
                s: it.span,
            };
            match it.type_args {
                Some(_) => {
                    return self
                        .error(&anchor, DiagnosticInfoMessage::TypeArgsInExtendsUnsupported);
                }
                None => match it.expr.as_ref() {
                    Expr::Ident(id) => {
                        let addr = TypeAddress {
                            file: file.clone(),
                            name: id.sym.to_string(),
                        };
                        let rt_name = RuntypeName::Address(addr.clone());
                        let id_ty = self.extract_addressed_type(&rt_name, vec![], &anchor)?;

                        vs.push(id_ty);
                    }
                    _ => {
                        return self.error(&anchor, DiagnosticInfoMessage::ExtendsShouldBeIdent);
                    }
                },
            }
        }

        Ok(vs)
    }
    fn extract_interface_decl(
        &mut self,
        typ: &TsInterfaceDecl,
        type_args: Vec<Runtype>,
        file: BffFileName,
    ) -> Res<Runtype> {
        let anchor = Anchor {
            f: file.clone(),
            s: typ.span,
        };
        assert!(
            typ.type_params.is_none(),
            "generic interfaces not supported yet"
        );
        assert!(type_args.is_empty(), "generic interfaces not supported yet");

        let r = Ok(Runtype::object(
            typ.body
                .body
                .iter()
                .map(|x| self.extract_ts_type_element(x, file.clone()))
                .collect::<Res<_>>()?,
        ));

        if typ.extends.is_empty() {
            r
        } else {
            let ext = self.extract_interface_extends(&typ.extends, file.clone())?;
            let merged = Runtype::all_of(ext.into_iter().chain(std::iter::once(r?)).collect());
            let res = self.extract_object_from_runtype(&merged, &anchor);
            match res {
                Ok(vs) => Ok(Runtype::object(vs.into_iter().collect())),
                Err(_) => Ok(merged),
            }
        }
    }

    fn collect_consts_from_union(&self, it: Runtype) -> Result<Vec<String>, DiagnosticInfoMessage> {
        let mut string_keys = vec![];

        for v in self.extract_union(it)? {
            match v.extract_single_string_const() {
                Some(str) => {
                    string_keys.push(str.clone());
                }
                _ => {
                    return Err(DiagnosticInfoMessage::RecordKeyUnionShouldBeOnlyStrings);
                }
            }
        }

        Ok(string_keys)
    }
    fn convert_required(&mut self, obj: &BTreeMap<String, Optionality<Runtype>>) -> Runtype {
        let mut acc = vec![];
        for (k, v) in obj {
            acc.push((k.clone(), v.clone().to_required()));
        }
        Runtype::object(acc)
    }
    fn convert_partial(&mut self, obj: &BTreeMap<String, Optionality<Runtype>>) -> Runtype {
        let mut acc = vec![];
        for (k, v) in obj {
            acc.push((k.clone(), v.clone().to_optional()));
        }
        Runtype::object(acc)
    }
    fn convert_pick_keys(
        obj: &BTreeMap<String, Optionality<Runtype>>,
        keys: Vec<String>,
    ) -> Runtype {
        let mut acc = vec![];
        for (k, v) in obj {
            if keys.contains(k) {
                acc.push((k.clone(), v.clone()));
            }
        }
        Runtype::object(acc)
    }
    fn convert_pick(
        &mut self,
        obj: &BTreeMap<String, Optionality<Runtype>>,
        keys: Runtype,
        anchor: &Anchor,
    ) -> Res<Runtype> {
        match keys.extract_single_string_const() {
            Some(str) => Ok(Self::convert_pick_keys(obj, vec![str])),
            None => match keys {
                Runtype::AnyOf(rms) => {
                    let mut keys = vec![];
                    for rm in rms {
                        match rm.extract_single_string_const() {
                            Some(str) => {
                                keys.push(str);
                            }
                            None => match rm {
                                Runtype::Ref(n) => {
                                    let map = self
                                        .partial_validators
                                        .get(&n)
                                        .and_then(|it| it.as_ref())
                                        .cloned();
                                    let k = map.and_then(|it| it.extract_single_string_const());
                                    match k {
                                        Some(str) => keys.push(str),
                                        _ => {
                                            return self.error(
                                                &anchor,
                                                DiagnosticInfoMessage::PickNeedsString,
                                            );
                                        }
                                    }
                                }
                                _ => {
                                    return self
                                        .error(&anchor, DiagnosticInfoMessage::PickNeedsString);
                                }
                            },
                        }
                    }
                    Ok(Self::convert_pick_keys(obj, keys))
                }
                _ => self.error(
                    &anchor,
                    DiagnosticInfoMessage::PickShouldHaveStringOrStringArrayAsTypeArgument,
                ),
            },
        }
    }
    fn convert_omit_keys(
        obj: &BTreeMap<String, Optionality<Runtype>>,
        keys: Vec<String>,
    ) -> Runtype {
        let mut acc = vec![];
        for (k, v) in obj {
            if !keys.contains(k) {
                acc.push((k.clone(), v.clone()));
            }
        }
        Runtype::object(acc)
    }

    fn convert_omit(
        &mut self,
        obj: &BTreeMap<String, Optionality<Runtype>>,
        keys: Runtype,
        anchor: &Anchor,
    ) -> Res<Runtype> {
        let keys = self
            .extract_union(keys)
            .map_err(|e| self.box_error(&anchor, e))?;
        let str_keys = keys
            .iter()
            .map(|it| match it.extract_single_string_const() {
                Some(str) => Ok(str.clone()),
                _ => self.error(
                    &anchor,
                    DiagnosticInfoMessage::OmitShouldHaveStringAsTypeArgument,
                ),
            })
            .collect::<Res<Vec<_>>>()?;
        Ok(Self::convert_omit_keys(obj, str_keys))
    }

    fn extract_addressed_type(
        &mut self,
        runtype_name: &RuntypeName,
        type_args: Vec<Runtype>,
        anchor: &Anchor,
    ) -> Res<Runtype> {
        match runtype_name {
            RuntypeName::Address(module_item_address) => {
                let addressed_type =
                    self.get_addressed_type(&module_item_address.to_module_item_addr(), &anchor)?;
                match addressed_type {
                    AddressedType::Type {
                        t: decl,
                        local_address: address,
                    } => {
                        let mut count = 0;

                        let type_params = match &decl.type_params {
                            Some(p) => {
                                //
                                p.params.iter().map(|tp| tp.name.sym.to_string()).collect()
                            }
                            None => vec![],
                        };
                        for (param, arg) in type_params.into_iter().zip(type_args.iter()) {
                            self.type_application_stack.push((param, arg.clone()));
                            count += 1;
                        }
                        let runtype = self.extract_type(&decl.type_ann, address.file.clone());
                        for _ in 0..count {
                            self.type_application_stack.pop();
                        }
                        Ok(runtype?)
                    }
                    AddressedType::Interface {
                        t,
                        local_address: _,
                    } => {
                        let runtype = self.extract_interface_decl(
                            &t,
                            type_args,
                            module_item_address.file.clone(),
                        )?;
                        Ok(runtype)
                    }
                    AddressedType::Enum {
                        t,
                        local_address: address,
                    } => {
                        let runtype = self.extract_enum_decl(&t, address.file.clone())?;
                        Ok(runtype)
                    }
                }
            }
            RuntypeName::EnumItem {
                address: enum_type,
                member_name,
            } => {
                let ty =
                    self.get_addressed_qualified_type(&enum_type.to_module_item_addr(), &anchor)?;
                if let AddressedQualifiedType::WillBeUsedForEnumItem { enum_type, address } = ty {
                    let found = enum_type.members.iter().find(|it| match &it.id {
                        TsEnumMemberId::Ident(ident) => &ident.sym == member_name,
                        TsEnumMemberId::Str(_) => unreachable!(),
                    });
                    return match found.and_then(|it| it.init.clone()) {
                        Some(init) => self.typeof_expr(&init, true, address.file.clone()),
                        None => self.error(&anchor, DiagnosticInfoMessage::EnumMemberNoInit),
                    };
                };
                self.error(&anchor, DiagnosticInfoMessage::EnumItemShouldBeFromEnumType)
            }
            RuntypeName::SemtypeRecursiveGenerated(_) => todo!(),
            RuntypeName::BuiltIn(ts_built_in) => match ts_built_in {
                TsBuiltIn::Date => Ok(Runtype::Date),
                TsBuiltIn::Array => match type_args.as_slice() {
                    [ty] => Ok(Runtype::Array(ty.clone().into())),
                    _ => self.error(
                        &anchor,
                        DiagnosticInfoMessage::InvalidNumberOfTypeParametersForArray,
                    ),
                },
                TsBuiltIn::StringFormat => self.get_string_with_format(&type_args, &anchor),
                TsBuiltIn::StringFormatExtends => {
                    self.get_string_format_extends(&type_args, anchor)
                }
                TsBuiltIn::NumberFormat => self.get_number_with_format(&type_args, anchor),
                TsBuiltIn::NumberFormatExtends => {
                    self.get_number_format_extends(&type_args, anchor)
                }
                TsBuiltIn::Object => Ok(Runtype::any_object()),

                TsBuiltIn::Record => {
                    if type_args.len() != 2 {
                        return self.error(
                            &anchor,
                            DiagnosticInfoMessage::RecordShouldHaveTwoTypeArguments,
                        );
                    }

                    let mut key = type_args[0].clone();
                    let mut is_ref = matches!(key, Runtype::Ref(_));

                    while is_ref {
                        if let Runtype::Ref(r) = &type_args[0] {
                            let map = self
                                .partial_validators
                                .get(r)
                                .and_then(|it| it.as_ref())
                                .cloned();
                            if let Some(schema) = map {
                                key = schema;
                                is_ref = matches!(key, Runtype::Ref(_));
                            }
                        }
                    }
                    let key_clone = key.clone();
                    match self.collect_consts_from_union(key) {
                        Ok(res) => {
                            let value = type_args[1].clone();
                            Ok(Runtype::object(
                                res.into_iter()
                                    .map(|it| (it, value.clone().required()))
                                    .collect(),
                            ))
                        }
                        Err(_) => {
                            let value = type_args[1].clone();
                            Ok(Runtype::Object {
                                vs: BTreeMap::new(),
                                indexed_properties: Some(
                                    IndexedProperty {
                                        key: key_clone,
                                        value: value.required(),
                                    }
                                    .into(),
                                ),
                            })
                        }
                    }
                }
                TsBuiltIn::Pick => match type_args.as_slice() {
                    [obj, keys] => {
                        let vs = self.extract_object_from_runtype(obj, anchor)?;
                        self.convert_pick(&vs, keys.clone(), anchor)
                    }
                    _ => self.error(
                        &anchor,
                        DiagnosticInfoMessage::PickShouldHaveTwoTypeArguments,
                    ),
                },
                TsBuiltIn::Omit => match type_args.as_slice() {
                    [obj, keys] => {
                        let vs = self.extract_object_from_runtype(obj, anchor)?;
                        self.convert_omit(&vs, keys.clone(), anchor)
                    }
                    _ => self.error(
                        &anchor,
                        DiagnosticInfoMessage::OmitShouldHaveTwoTypeArguments,
                    ),
                },
                TsBuiltIn::Exclude => match type_args.as_slice() {
                    [left, right] => {
                        let mut ctx = SemTypeContext::new();

                        let left_ty = left.clone();

                        let validators_vec = self.validators_vec();
                        let validators_reference_vec: Vec<&NamedSchema> =
                            validators_vec.iter().collect();

                        let left_st = left_ty
                            .to_sem_type(&validators_reference_vec, &mut ctx)
                            .map_err(|e| {
                                self.box_error(
                                    &anchor,
                                    DiagnosticInfoMessage::AnyhowError(e.to_string()),
                                )
                            })?;

                        let right_ty = right.clone();

                        let right_st = right_ty
                            .to_sem_type(&validators_reference_vec, &mut ctx)
                            .map_err(|e| {
                                self.box_error(
                                    &anchor,
                                    DiagnosticInfoMessage::AnyhowError(e.to_string()),
                                )
                            })?;

                        let subtracted_ty = left_st.diff(&right_st).map_err(|e| {
                            self.box_error(
                                &anchor,
                                DiagnosticInfoMessage::AnyhowError(e.to_string()),
                            )
                        })?;
                        let res = self
                            .semtype_to_runtype(subtracted_ty, &mut ctx, &anchor)?
                            .remove_nots_of_intersections_and_empty_of_union(
                                &validators_reference_vec,
                                &mut ctx,
                            )
                            .map_err(|e| {
                                self.box_error(
                                    &anchor,
                                    DiagnosticInfoMessage::AnyhowError(e.to_string()),
                                )
                            })?;
                        Ok(res)
                    }
                    _ => self.error(
                        &anchor,
                        DiagnosticInfoMessage::ExcludeShouldHaveTwoTypeArguments,
                    ),
                },
                TsBuiltIn::Required => match type_args.as_slice() {
                    [obj] => {
                        let vs = self.extract_object_from_runtype(obj, &anchor)?;
                        Ok(self.convert_required(&vs))
                    }
                    _ => self.error(
                        &anchor,
                        DiagnosticInfoMessage::RequiredShouldHaveTwoTypeArguments,
                    ),
                },
                TsBuiltIn::Partial => match type_args.as_slice() {
                    [obj] => {
                        let vs = self.extract_object_from_runtype(obj, &anchor)?;
                        Ok(self.convert_partial(&vs))
                    }
                    _ => self.error(
                        &anchor,
                        DiagnosticInfoMessage::PartialShouldHaveTwoTypeArguments,
                    ),
                },
            },
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
                let anchor = Anchor {
                    f: file.clone(),
                    s: ts_qualified_name.span(),
                };
                match left_part {
                    AddressedQualifiedType::StarImport(bff_file_name) => {
                        let new_addr = ModuleItemAddress {
                            file: bff_file_name.clone(),
                            name: ts_qualified_name.right.sym.to_string(),
                            visibility: Visibility::Export,
                        };
                        self.get_addressed_qualified_type(&new_addr, &anchor)
                    }
                    it @ AddressedQualifiedType::WillBeUsedForEnumItem { .. } => Ok(it),
                }
            }
            TsEntityName::Ident(ident) => {
                let addr = ModuleItemAddress::from_ident(
                    ident,
                    file.clone(),
                    // TODO: is visibility correct here?
                    Visibility::Local,
                );
                let anchor = Anchor {
                    f: file.clone(),
                    s: ident.span,
                };
                let type_addressed = self.get_addressed_qualified_type(&addr, &anchor)?;
                Ok(type_addressed)
            }
        }
    }

    fn maybe_generate_ts_builtin(&mut self, name: &str) -> Res<Option<TsBuiltIn>> {
        let bt = match name {
            "Date" => Some(TsBuiltIn::Date),
            "Array" | "ReadonlyArray" => Some(TsBuiltIn::Array),
            "StringFormat" => Some(TsBuiltIn::StringFormat),
            "StringFormatExtends" => Some(TsBuiltIn::StringFormatExtends),
            "NumberFormat" => Some(TsBuiltIn::NumberFormat),
            "NumberFormatExtends" => Some(TsBuiltIn::NumberFormatExtends),
            "Record" => Some(TsBuiltIn::Record),
            "Omit" => Some(TsBuiltIn::Omit),
            "Object" => Some(TsBuiltIn::Object),
            "Required" => Some(TsBuiltIn::Required),
            "Partial" => Some(TsBuiltIn::Partial),
            "Pick" => Some(TsBuiltIn::Pick),
            "Exclude" => Some(TsBuiltIn::Exclude),
            _ => None,
        };
        Ok(bt)
    }

    fn get_runtype_name_from_ts_entity_name(
        &mut self,
        type_name: &TsEntityName,
        file: BffFileName,
        visibility: Visibility,
        anchor: &Anchor,
    ) -> Res<RuntypeName> {
        match type_name {
            TsEntityName::Ident(ident) => {
                if let Some(builtin) = self.maybe_generate_ts_builtin(&ident.sym)? {
                    Ok(RuntypeName::BuiltIn(builtin))
                } else {
                    let addr: ModuleItemAddress =
                        ModuleItemAddress::from_ident(ident, file, visibility);

                    Ok(RuntypeName::Address(
                        self.get_addressed_type(&addr, &anchor)?.type_address(),
                    ))
                }
            }
            TsEntityName::TsQualifiedName(ts_qualified_name) => {
                let qualified_type = self.get_adressed_qualified_type_from_entity_name(
                    &ts_qualified_name.left,
                    file.clone(),
                )?;

                let new_addr = match qualified_type {
                    AddressedQualifiedType::StarImport(bff_file_name) => ModuleItemAddress {
                        file: bff_file_name,
                        name: ts_qualified_name.right.sym.to_string(),
                        visibility: Visibility::Export,
                    },
                    AddressedQualifiedType::WillBeUsedForEnumItem {
                        enum_type: _,
                        address,
                    } => {
                        return Ok(RuntypeName::EnumItem {
                            member_name: ts_qualified_name.right.sym.to_string(),
                            address,
                        });
                    }
                };
                Ok(RuntypeName::Address(
                    self.get_addressed_type(&new_addr, &anchor)?.type_address(),
                ))
            }
        }
    }
    fn insert_definition(&mut self, addr: RuntypeUUID, schema: Runtype) -> Res<Runtype> {
        if let Some(Some(v)) = self.partial_validators.get(&addr) {
            assert_eq!(v, &schema);
            return Ok(Runtype::Ref(addr));
        }
        self.partial_validators.insert(addr.clone(), Some(schema));
        Ok(Runtype::Ref(addr))
    }

    fn get_string_with_format(&mut self, type_args: &[Runtype], anchor: &Anchor) -> Res<Runtype> {
        if let [head] = type_args
            && let Some(value) = head.as_string_const()
        {
            let val_str = value.to_string();
            if self.settings.string_formats.contains(&val_str) {
                return Ok(Runtype::StringWithFormat(CustomFormat(val_str, vec![])));
            } else {
                return self.error(&anchor, DiagnosticInfoMessage::CustomStringIsNotRegistered);
            }
        }
        self.error(
            &anchor,
            DiagnosticInfoMessage::InvalidUsageOfStringFormatTypeParameter,
        )
    }
    fn get_string_format_base_formats(
        &mut self,
        schema: &Runtype,
        anchor: &Anchor,
    ) -> Res<(String, Vec<String>)> {
        match schema {
            Runtype::StringWithFormat(CustomFormat(first, rest)) => {
                Ok((first.clone(), rest.clone()))
            }
            Runtype::Ref(r) => {
                let v = self.partial_validators.get(r);

                let v = v.and_then(|it| it.clone());
                if let Some(v) = v {
                    self.get_string_format_base_formats(&v, anchor)
                } else {
                    self.error(
                        &anchor,
                        DiagnosticInfoMessage::CouldNotFindBaseOfStringFormatExtends,
                    )
                }
            }
            _ => self.error(
                &anchor,
                DiagnosticInfoMessage::BaseOfStringFormatExtendsShouldBeStringFormat,
            ),
        }
    }

    fn get_string_format_extends(
        &mut self,
        type_params: &[Runtype],
        anchor: &Anchor,
    ) -> Res<Runtype> {
        if let [base, next_str] = type_params
            && let Some(value) = next_str.as_string_const()
        {
            let next_str = value.to_string();
            if self.settings.string_formats.contains(&next_str) {
                let (first, mut rest) = self.get_string_format_base_formats(base, anchor)?;
                rest.push(next_str);
                return Ok(Runtype::StringWithFormat(CustomFormat(first, rest)));
            } else {
                return self.error(&anchor, DiagnosticInfoMessage::CustomStringIsNotRegistered);
            }
        }
        self.error(
            &anchor,
            DiagnosticInfoMessage::InvalidUsageOfStringFormatExtendsTypeParameter,
        )
    }
    fn get_number_with_format(&mut self, type_args: &[Runtype], anchor: &Anchor) -> Res<Runtype> {
        if let [head] = type_args
            && let Some(value) = head.as_string_const()
        {
            let val_str = value.to_string();
            if self.settings.number_formats.contains(&val_str) {
                return Ok(Runtype::NumberWithFormat(CustomFormat(val_str, vec![])));
            } else {
                return self.error(&anchor, DiagnosticInfoMessage::CustomNumberIsNotRegistered);
            }
        }
        self.error(
            &anchor,
            DiagnosticInfoMessage::InvalidUsageOfNumberFormatTypeParameter,
        )
    }
    fn get_number_format_base_formats(
        &mut self,
        schema: &Runtype,
        anchor: &Anchor,
    ) -> Res<(String, Vec<String>)> {
        match schema {
            Runtype::NumberWithFormat(CustomFormat(first, rest)) => {
                Ok((first.clone(), rest.clone()))
            }
            Runtype::Ref(r) => {
                let v = self.partial_validators.get(r);

                let v = v.and_then(|it| it.clone());
                if let Some(v) = v {
                    self.get_number_format_base_formats(&v, anchor)
                } else {
                    self.error(
                        &anchor,
                        DiagnosticInfoMessage::CouldNotFindBaseOfNumberFormatExtends,
                    )
                }
            }
            _ => self.error(
                &anchor,
                DiagnosticInfoMessage::BaseOfNumberFormatExtendsShouldBeNumberFormat,
            ),
        }
    }
    fn get_number_format_extends(
        &mut self,
        type_params: &[Runtype],
        anchor: &Anchor,
    ) -> Res<Runtype> {
        if let [base, next_str] = type_params
            && let Some(value) = next_str.as_string_const()
        {
            let next_str = value.to_string();
            if self.settings.number_formats.contains(&next_str) {
                let (first, mut rest) = self.get_number_format_base_formats(base, anchor)?;
                rest.push(next_str);
                return Ok(Runtype::NumberWithFormat(CustomFormat(first, rest)));
            } else {
                return self.error(&anchor, DiagnosticInfoMessage::CustomNumberIsNotRegistered);
            }
        }
        self.error(
            &anchor,
            DiagnosticInfoMessage::InvalidUsageOfNumberFormatExtendsTypeParameter,
        )
    }

    fn extract_type_from_ts_entity_name(
        &mut self,
        type_name: &TsEntityName,
        ts_type_args: &Option<Box<TsTypeParamInstantiation>>,
        file: BffFileName,
        visibility: Visibility,
        anchor: &Anchor,
    ) -> Res<Runtype> {
        if let TsEntityName::Ident(ident) = type_name {
            for (n, t) in self.type_application_stack.iter() {
                if ident.sym == *n {
                    return Ok(t.clone());
                }
            }
        }

        let type_args = match ts_type_args {
            Some(its) => {
                let mut args = vec![];
                for ty in &its.params {
                    let arg_ty = self.extract_type(ty, file.clone())?;
                    args.push(arg_ty);
                }
                args
            }
            None => vec![],
        };

        let fat =
            self.get_runtype_name_from_ts_entity_name(type_name, file.clone(), visibility, anchor)?;
        if fat.is_builtin() {
            // it won't be recursive if it's builtin, and we don't need to write it's definition
            return self.extract_addressed_type(&fat, type_args, anchor);
        }
        let rt_uuid = RuntypeUUID {
            ty: fat.clone(),
            type_arguments: type_args.clone(),
        };
        let found = self.partial_validators.get(&rt_uuid);
        if let Some(_found_in_map) = found {
            if ts_type_args.is_some() {
                self.recursive_generic_uuids.insert(rt_uuid.clone());
            }
            return Ok(Runtype::Ref(rt_uuid));
        }
        self.partial_validators.insert(rt_uuid.clone(), None);

        let ty = self.extract_addressed_type(&fat, type_args, anchor);
        match ty {
            // Ok(ty) => match ts_type_args {
            //     None => self.insert_definition(rt_uuid.clone(), ty),
            //     Some(_) => {
            //         // We don't need to store a named type for each type application, just return the type.
            //         // Unless it's recursive generic, then we need to keep the named type
            //         // TODO: it might be good for performance to re-use the named type too
            //         if self.recursive_generic_uuids.contains(&rt_uuid) {
            //             self.insert_definition(rt_uuid, ty)
            //         } else {
            //             self.partial_validators.remove(&rt_uuid);
            //             Ok(ty)
            //         }
            //     }
            // },
            Ok(ty) => self.insert_definition(rt_uuid.clone(), ty),
            Err(e) => {
                self.insert_definition(rt_uuid, Runtype::Any)?;
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

        let anchor = Anchor {
            f: file.clone(),
            s: ty.span,
        };

        self.extract_type_from_ts_entity_name(
            type_name,
            type_params,
            file,
            Visibility::Local,
            &anchor,
        )
    }

    fn extract_ts_keyword_type(&mut self, ty: &TsKeywordType, file: BffFileName) -> Res<Runtype> {
        let anchor = Anchor {
            f: file.clone(),
            s: ty.span,
        };
        match ty.kind {
            TsKeywordTypeKind::TsStringKeyword => Ok(Runtype::String),
            TsKeywordTypeKind::TsNumberKeyword => Ok(Runtype::Number),
            TsKeywordTypeKind::TsAnyKeyword => Ok(Runtype::Any),
            TsKeywordTypeKind::TsUnknownKeyword => Ok(Runtype::Any),
            TsKeywordTypeKind::TsObjectKeyword => Ok(Runtype::any_object()),
            TsKeywordTypeKind::TsBooleanKeyword => Ok(Runtype::Boolean),
            TsKeywordTypeKind::TsBigIntKeyword => Ok(Runtype::BigInt),

            TsKeywordTypeKind::TsVoidKeyword => Ok(Runtype::Void),
            TsKeywordTypeKind::TsUndefinedKeyword => Ok(Runtype::Undefined),
            TsKeywordTypeKind::TsNullKeyword => Ok(Runtype::Null),
            TsKeywordTypeKind::TsNeverKeyword => Ok(Runtype::Never),
            TsKeywordTypeKind::TsSymbolKeyword | TsKeywordTypeKind::TsIntrinsicKeyword => {
                self.error(&anchor, DiagnosticInfoMessage::KeywordNonSerializable)
            }
        }
    }
    fn extract_array_value(&mut self, arr: Runtype, span: Span, file: BffFileName) -> Res<Runtype> {
        let anchor = Anchor {
            f: file.clone(),
            s: span,
        };
        match arr {
            Runtype::Array(items) => Ok(*items),
            Runtype::Ref(n) => {
                let map = self
                    .partial_validators
                    .get(&n)
                    .and_then(|it| it.as_ref())
                    .cloned();
                match map {
                    Some(schema) => self.extract_array_value(schema, span, file.clone()),
                    _ => self.error(&anchor, DiagnosticInfoMessage::ExpectedArray),
                }
            }
            _ => self.error(&anchor, DiagnosticInfoMessage::ExpectedArray),
        }
    }
    fn extract_tuple_value(
        &mut self,
        arr: Runtype,
        span: Span,
        file: BffFileName,
    ) -> Res<Vec<Runtype>> {
        let anchor = Anchor {
            f: file.clone(),
            s: span,
        };
        match arr {
            Runtype::Tuple {
                mut prefix_items,
                items,
            } => {
                if let Some(r) = items {
                    prefix_items.push(*r);
                }
                Ok(prefix_items)
            }
            Runtype::Ref(n) => {
                let map = self
                    .partial_validators
                    .get(&n)
                    .and_then(|it| it.as_ref())
                    .cloned();
                match map {
                    Some(schema) => self.extract_tuple_value(schema, span, file.clone()),
                    _ => self.error(&anchor, DiagnosticInfoMessage::ExpectedTuple),
                }
            }
            _ => self.error(&anchor, DiagnosticInfoMessage::ExpectedTuple),
        }
    }

    pub fn typeof_expr(&mut self, e: &Expr, as_const: bool, file: BffFileName) -> Res<Runtype> {
        let anchor = Anchor {
            f: file.clone(),
            s: e.span(),
        };
        match e {
            Expr::Tpl(s) => {
                if as_const {
                    let mut acc: Vec<TplLitTypeItem> = vec![];

                    for it in &s.exprs {
                        let ty = match it.as_ref() {
                            Expr::Call(_) => Ok(Runtype::String),
                            _ => self.typeof_expr(it, as_const, file.clone()),
                        }?;
                        let res = self.runtype_to_tpl_lit(&it.span(), &ty, file.clone())?;
                        acc.push(res);
                    }

                    Ok(Runtype::TplLitType(TplLitType(acc)))
                } else {
                    Ok(Runtype::String)
                }
            }
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
                Lit::Regex(_) => {
                    self.error(&anchor, DiagnosticInfoMessage::TypeOfRegexNotSupported)
                }
                Lit::JSXText(_) => {
                    self.error(&anchor, DiagnosticInfoMessage::TypeOfJSXTextNotSupported)
                }
            },
            Expr::Ident(i) => {
                let new_addr = ModuleItemAddress {
                    file: file.clone(),
                    name: i.sym.to_string(),
                    visibility: Visibility::Local,
                };
                self.extract_addressed_value(&new_addr, &anchor)
            }
            Expr::Array(lit) => {
                let mut prefix_items = vec![];
                for it in lit.elems.iter().flatten() {
                    match it.spread {
                        Some(span) => {
                            let ty_schema = self.typeof_expr(&it.expr, as_const, file.clone())?;

                            match self.extract_tuple_value(ty_schema.clone(), span, file.clone()) {
                                Ok(vs) => {
                                    prefix_items.extend(vs);
                                }
                                Err(_) => {
                                    let inner_schema =
                                        self.extract_array_value(ty_schema, span, file.clone())?;
                                    prefix_items.push(inner_schema);
                                }
                            }
                        }
                        None => {
                            let ty_schema = self.typeof_expr(&it.expr, as_const, file.clone())?;
                            prefix_items.push(ty_schema);
                        }
                    }
                }
                Ok(Runtype::Tuple {
                    prefix_items,
                    items: None,
                })
            }
            Expr::Object(lit) => {
                let mut vs = vec![];

                for it in &lit.props {
                    match it {
                        PropOrSpread::Spread(sp) => {
                            let spread_ty = self.typeof_expr(&sp.expr, as_const, file.clone())?;

                            if let Runtype::Object { vs: spread_vs, .. } = spread_ty {
                                for (k, v) in spread_vs {
                                    vs.push((k, v));
                                }
                            } else {
                                return self.error(
                                    &anchor,
                                    DiagnosticInfoMessage::TypeofObjectUnsupportedSpread,
                                );
                            }
                        }
                        PropOrSpread::Prop(p) => match p.as_ref() {
                            Prop::KeyValue(p) => {
                                let key: String = match &p.key {
                                    PropName::Ident(id) => id.sym.to_string(),
                                    PropName::Str(st) => st.value.to_string(),
                                    PropName::Num(_) => {
                                        return self.error(
                                            &anchor,
                                            DiagnosticInfoMessage::TypeofObjectUnsupportedPropNum,
                                        );
                                    }
                                    PropName::Computed(_) => return self.error(
                                        &anchor,
                                        DiagnosticInfoMessage::TypeofObjectUnsupportedPropComputed,
                                    ),
                                    PropName::BigInt(_) => return self.error(
                                        &anchor,
                                        DiagnosticInfoMessage::TypeofObjectUnsupportedPropBigInt,
                                    ),
                                };
                                let value = self.typeof_expr(&p.value, as_const, file.clone())?;
                                vs.push((key, value.required()));
                            }
                            Prop::Shorthand(p) => {
                                let key: String = p.sym.to_string();
                                let value = self.typeof_expr(
                                    &Expr::Ident(p.clone()),
                                    as_const,
                                    file.clone(),
                                )?;
                                vs.push((key, value.required()));
                            }
                            Prop::Assign(_)
                            | Prop::Getter(_)
                            | Prop::Setter(_)
                            | Prop::Method(_) => {
                                return self.error(
                                    &anchor,
                                    DiagnosticInfoMessage::TypeofObjectUnsupportedProp,
                                );
                            }
                        },
                    }
                }

                Ok(Runtype::object(vs))
            }
            Expr::TsSatisfies(c) => self.typeof_expr(&c.expr, as_const, file.clone()),
            Expr::Member(m) => {
                let k = match &m.prop {
                    MemberProp::Ident(i) => Some(i.sym.to_string()),
                    MemberProp::Computed(c) => self
                        .typeof_expr(&c.expr, as_const, file.clone())?
                        .extract_single_string_const(),
                    MemberProp::PrivateName(_) => None,
                };
                if let Some(key) = &k {
                    let from_enum = if let Expr::Ident(i) = m.obj.as_ref() {
                        let new_addr = ModuleItemAddress {
                            file: file.clone(),
                            name: i.sym.to_string(),
                            visibility: Visibility::Local,
                        };
                        let decl = self.get_addressed_value(&new_addr, &anchor)?;
                        match decl {
                            AddressedValue::ValueExpr { .. } => None,
                            AddressedValue::TypeDecl { .. } => None,
                            AddressedValue::Enum(ts_enum_decl, bff_file_name) => {
                                Some((ts_enum_decl.clone(), bff_file_name.clone()))
                            }
                        }
                    } else {
                        None
                    };
                    if let Some((from_enum, enum_file_name)) = from_enum {
                        if !as_const {
                            return self.extract_enum_decl(&from_enum, enum_file_name.clone());
                        }
                        let Some(enum_value) = from_enum.members.iter().find(|it| match &it.id {
                            TsEnumMemberId::Ident(i) => i.sym == *key,
                            TsEnumMemberId::Str(_) => unreachable!(),
                        }) else {
                            return self.error(&anchor, DiagnosticInfoMessage::EnumMemberNotFound);
                        };
                        let Some(init) = &enum_value.init else {
                            return self.error(&anchor, DiagnosticInfoMessage::EnumMemberNoInit);
                        };

                        return self.typeof_expr(init, true, enum_file_name.clone());
                    }
                }
                let obj = self.typeof_expr(&m.obj, as_const, file.clone())?;

                let key: Runtype = match &m.prop {
                    MemberProp::Ident(i) => Runtype::single_string_const(&i.sym),
                    MemberProp::PrivateName(_) => {
                        return self.error(
                            &anchor,
                            DiagnosticInfoMessage::TypeofPrivateNameNotSupported,
                        );
                    }
                    MemberProp::Computed(c) => {
                        let v = self.typeof_expr(&c.expr, as_const, file.clone())?;
                        v
                    }
                };
                self.do_indexed_access_on_types(&obj, &key, &anchor)
            }
            Expr::Arrow(_a) => Ok(Runtype::Function),
            Expr::Bin(e) => {
                let left = self.typeof_expr(&e.left, as_const, file.clone())?;
                let right = self.typeof_expr(&e.right, as_const, file.clone())?;

                match (left, right) {
                    (Runtype::Number, Runtype::Number) => Ok(Runtype::Number),
                    (Runtype::String, Runtype::String) => Ok(Runtype::String),
                    _ => self.error(&anchor, DiagnosticInfoMessage::CannotConvertExpr),
                }
            }
            _ => {
                dbg!(&e);
                self.error(&anchor, DiagnosticInfoMessage::CannotConvertExpr)
            }
        }
    }

    fn extract_addressed_value(
        &mut self,
        address: &ModuleItemAddress,
        anchor: &Anchor,
    ) -> Res<Runtype> {
        let addressed_value = self.get_addressed_value(address, &anchor)?;
        match addressed_value {
            AddressedValue::ValueExpr(expr, expr_file) => {
                self.typeof_expr(expr.as_ref(), false, expr_file)
            }
            AddressedValue::TypeDecl(ts_type, bff_file_name) => {
                self.extract_type(&ts_type, bff_file_name)
            }
            AddressedValue::Enum(ts_enum_decl, bff_file_name) => {
                self.extract_enum_decl(&ts_enum_decl, bff_file_name)
            }
        }
    }

    fn get_addressed_qualified_value_from_entity_name(
        &mut self,
        q: &TsEntityName,
        file: BffFileName,
    ) -> Res<AddressedQualifiedValue> {
        let anchor = Anchor {
            f: file.clone(),
            s: q.span(),
        };
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
                        self.get_addressed_qualified_value(&new_addr, &anchor)
                    }
                    base @ AddressedQualifiedValue::MemberExpr { .. }
                    | base @ AddressedQualifiedValue::ValueExpr(_, _) => {
                        Ok(AddressedQualifiedValue::MemberExpr {
                            base: Box::new(base),
                            member: ts_qualified_name.right.sym.to_string(),
                            file_name: file.clone(),
                        })
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
                let value_addressed = self.get_addressed_qualified_value(&addr, &anchor)?;
                Ok(value_addressed)
            }
        }
    }

    fn access_qualified_value(
        &mut self,
        base: &AddressedQualifiedValue,
        member: &str,
        anchor: &Anchor,
    ) -> Res<Runtype> {
        match base {
            AddressedQualifiedValue::StarOfFile(bff_file_name) => {
                let new_addr = ModuleItemAddress {
                    file: bff_file_name.clone(),
                    name: member.to_string(),
                    visibility: Visibility::Export,
                };
                self.extract_addressed_value(&new_addr, anchor)
            }
            AddressedQualifiedValue::ValueExpr(expr, bff_file_name) => {
                let base_ty = self.typeof_expr(expr, false, bff_file_name.clone())?;
                let key_ty = Runtype::single_string_const(member);
                self.do_indexed_access_on_types(&base_ty, &key_ty, anchor)
            }
            AddressedQualifiedValue::MemberExpr {
                base: inner,
                member: member2,
                file_name: _,
            } => {
                let obj = self.access_qualified_value(inner, member2, anchor)?;
                let key = Runtype::single_string_const(member);
                self.do_indexed_access_on_types(&obj, &key, anchor)
            }
        }
    }

    fn extract_value_from_ts_qualified_name(
        &mut self,
        ts_qualified_name: &TsQualifiedName,
        file: BffFileName,
        anchor: &Anchor,
    ) -> Res<Runtype> {
        let left_value = self.get_addressed_qualified_value_from_entity_name(
            &ts_qualified_name.left,
            file.clone(),
        )?;

        self.access_qualified_value(&left_value, &ts_qualified_name.right.sym, anchor)
    }

    fn extract_value_ts_entity_name(
        &mut self,
        ts_entity_name: &TsEntityName,
        file: BffFileName,
        visibility: Visibility,
        anchor: &Anchor,
    ) -> Res<Runtype> {
        match ts_entity_name {
            TsEntityName::Ident(ident) => {
                let addr = ModuleItemAddress::from_ident(ident, file.clone(), visibility);
                self.extract_addressed_value(&addr, anchor)
            }
            TsEntityName::TsQualifiedName(ts_qualified_name) => {
                self.extract_value_from_ts_qualified_name(ts_qualified_name, file, anchor)
            }
        }
    }

    fn extract_type_query(
        &mut self,
        ty: &TsTypeQuery,
        file: BffFileName,
        visibility: Visibility,
    ) -> Res<Runtype> {
        let anchor = Anchor {
            f: file.clone(),
            s: ty.span,
        };
        if ty.type_args.is_some() {
            return self.error(&anchor, DiagnosticInfoMessage::TypeQueryArgsNotSupported);
        }

        match &ty.expr_name {
            TsTypeQueryExpr::TsEntityName(ts_entity_name) => {
                self.extract_value_ts_entity_name(ts_entity_name, file, visibility, &anchor)
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
                                ts_entity_name,
                                resolved,
                                Visibility::Export,
                                &anchor,
                            );
                        }
                        None => {
                            let new_addr = ModuleItemAddress {
                                file: resolved.clone(),
                                name: "default".to_string(),
                                visibility: Visibility::Export,
                            };
                            return self.extract_addressed_value(&new_addr, &anchor);
                        }
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
        let anchor = Anchor {
            f: file.clone(),
            s: import_type.span,
        };

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
                        &anchor,
                    );
                }
                None => {
                    let type_args = match &import_type.type_args {
                        Some(its) => {
                            let mut args = vec![];
                            for ty in &its.params {
                                let arg_ty = self.extract_type(ty, resolved.clone())?;
                                args.push(arg_ty);
                            }
                            args
                        }
                        None => vec![],
                    };
                    let new_addr = ModuleItemAddress {
                        file: resolved.clone(),
                        name: "default".to_string(),
                        visibility: Visibility::Export,
                    };
                    let resolved_addr = self.get_addressed_type(&new_addr, &anchor)?;
                    let rt_name = RuntypeName::Address(resolved_addr.type_address());
                    return self.extract_addressed_type(&rt_name, type_args, &anchor);
                }
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
        let anchor = Anchor {
            f: file.clone(),
            s: prop.span(),
        };
        match prop {
            TsTypeElement::TsPropertySignature(prop) => {
                let key = match &*prop.key {
                    Expr::Ident(ident) => ident.sym.to_string(),
                    Expr::Lit(Lit::Str(st)) => st.value.to_string(),
                    _ => {
                        return self.error(&anchor, DiagnosticInfoMessage::PropKeyShouldBeIdent);
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
                    None => {
                        self.error(&anchor, DiagnosticInfoMessage::PropShouldHaveTypeAnnotation)
                    }
                }
            }
            TsTypeElement::TsIndexSignature(_) => self.error(
                &anchor,
                DiagnosticInfoMessage::IndexSignatureNonSerializable,
            ),
            TsTypeElement::TsGetterSignature(_)
            | TsTypeElement::TsSetterSignature(_)
            | TsTypeElement::TsMethodSignature(_)
            | TsTypeElement::TsCallSignatureDecl(_)
            | TsTypeElement::TsConstructSignatureDecl(_) => {
                self.error(&anchor, DiagnosticInfoMessage::PropertyNonSerializable)
            }
        }
    }

    fn runtype_to_tpl_lit(
        &mut self,
        span: &Span,
        schema: &Runtype,
        file_name: BffFileName,
    ) -> Res<TplLitTypeItem> {
        let anchor = Anchor {
            f: file_name.clone(),
            s: *span,
        };
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
                    None => self.error(&anchor, DiagnosticInfoMessage::CannotResolveRefToTplLit),
                }
            }
            Runtype::TplLitType(it) => match it.0.as_slice() {
                [single] => Ok(single.clone()),
                _ => self.error(&anchor, DiagnosticInfoMessage::NestedTplLitToTplLit),
            },
            _ => self.error(
                &anchor,
                DiagnosticInfoMessage::TplLitTypeNonStringNonNumberNonBoolean,
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
        anchor: &Anchor,
    ) -> Res<Runtype> {
        if access_st.is_empty(ctx).map_err(|e| {
            self.box_error(&anchor, DiagnosticInfoMessage::AnyhowError(e.to_string()))
        })? {
            return Ok(Runtype::Never);
        }
        let (head, tail) = semtype_to_runtypes(
            ctx,
            &access_st,
            // TODO: do we need this?
            &RuntypeUUID {
                ty: RuntypeName::Address(TypeAddress {
                    file: anchor.f.clone(),
                    name: "AnyName".into(),
                }),
                type_arguments: vec![],
            },
            &mut self.counter,
        )
        .map_err(|any| {
            self.box_error(&anchor, DiagnosticInfoMessage::AnyhowError(any.to_string()))
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
        anchor: &Anchor,
    ) -> Res<Option<Runtype>> {
        // try to resolve syntatically
        match (obj, index) {
            (Runtype::Ref(r), _) => {
                let v = self.partial_validators.get(r);

                let v = v.and_then(|it| it.clone());
                if let Some(v) = v {
                    return self.convert_indexed_access_syntatically(&v, index, anchor);
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
                    if acc.is_empty() {
                        return self.error(
                            &anchor,
                            DiagnosticInfoMessage::KeyedAccessResultsInNeverType,
                        );
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

    fn do_indexed_access_on_types(
        &mut self,
        obj: &Runtype,
        index: &Runtype,
        anchor: &Anchor,
    ) -> Res<Runtype> {
        if let Some(res) = self.convert_indexed_access_syntatically(&obj, &index, &anchor)? {
            return Ok(res);
        }
        // fallback to semantic
        let mut ctx = SemTypeContext::new();

        let validators_vec = self.validators_vec();

        let obj_st = obj
            .to_sem_type(&validators_vec.iter().collect::<Vec<_>>(), &mut ctx)
            .map_err(|e| {
                self.box_error(&anchor, DiagnosticInfoMessage::AnyhowError(e.to_string()))
            })?;
        let idx_st = index
            .to_sem_type(&validators_vec.iter().collect::<Vec<_>>(), &mut ctx)
            .map_err(|e| {
                self.box_error(&anchor, DiagnosticInfoMessage::AnyhowError(e.to_string()))
            })?;

        let access_st: Rc<SemType> = ctx.indexed_access(obj_st, idx_st).map_err(|e| {
            self.box_error(&anchor, DiagnosticInfoMessage::AnyhowError(e.to_string()))
        })?;
        if access_st.is_never() {
            return self.error(
                &anchor,
                DiagnosticInfoMessage::KeyedAccessResultsInNeverType,
            );
        }

        self.semtype_to_runtype(access_st, &mut ctx, &anchor)
    }

    fn extract_indexed_access_type(
        &mut self,
        i: &TsIndexedAccessType,
        file: BffFileName,
    ) -> Res<Runtype> {
        let anchor = Anchor {
            f: file.clone(),
            s: i.span,
        };
        let obj = self.extract_type(&i.obj_type, file.clone())?;
        let index = self.extract_type(&i.index_type, file.clone())?;

        self.do_indexed_access_on_types(&obj, &index, &anchor)
    }
    fn convert_keyof(&mut self, k: &TsType, file_name: BffFileName) -> Res<Runtype> {
        let anchor = Anchor {
            f: file_name.clone(),
            s: k.span(),
        };
        let json_schema = self.extract_type(k, file_name.clone())?;

        let object_extracted = self.extract_object_from_runtype(&json_schema, &anchor);
        if let Ok(object_schema) = object_extracted {
            let keys = object_schema.keys();
            let mut vs = vec![];
            for key in keys {
                vs.push(Runtype::single_string_const(key));
            }
            return Ok(Runtype::any_of(vs));
        }

        let mut ctx = SemTypeContext::new();
        let vs = self.validators_vec();
        let st = json_schema
            .to_sem_type(&vs.iter().collect::<Vec<_>>(), &mut ctx)
            .map_err(|e| {
                self.box_error(&anchor, DiagnosticInfoMessage::AnyhowError(e.to_string()))
            })?;

        let keyof_st: Rc<SemType> = ctx.keyof(st).map_err(|e| {
            self.box_error(&anchor, DiagnosticInfoMessage::AnyhowError(e.to_string()))
        })?;

        self.semtype_to_runtype(keyof_st, &mut ctx, &anchor)
    }
    fn convert_mapped_type(&mut self, k: &TsMappedType, file_name: BffFileName) -> Res<Runtype> {
        let anchor = Anchor {
            f: file_name.clone(),
            s: k.span,
        };
        let name = k.type_param.name.sym.to_string();
        let constraint = match k.type_param.constraint {
            Some(ref it) => it.as_ref(),
            None => {
                return self.error(&anchor, DiagnosticInfoMessage::NoConstraintInMappedType);
            }
        };
        let constraint_schema = self.extract_type(constraint, file_name.clone())?;
        let values = self
            .extract_union(constraint_schema)
            .map_err(|e| self.box_error(&anchor, e))?;

        let mut string_keys = vec![];

        for v in values {
            match v.extract_single_string_const() {
                Some(s) => {
                    string_keys.push(s);
                }
                _ => {
                    return self.error(&anchor, DiagnosticInfoMessage::NonStringKeyInMappedType);
                }
            }
        }

        let type_ann = match &k.type_ann {
            Some(type_ann) => type_ann.as_ref(),
            None => {
                return self.error(&anchor, DiagnosticInfoMessage::NoTypeAnnotationInMappedType);
            }
        };

        let mut vs = vec![];
        for key in string_keys.into_iter() {
            self.type_application_stack
                .push((name.clone(), Runtype::single_string_const(&key)));

            let ty = self.extract_type(type_ann, file_name.clone())?;
            self.type_application_stack.pop();

            let ty = match k.optional {
                Some(opt) => match opt {
                    TruePlusMinus::True => Optionality::Optional(ty),
                    TruePlusMinus::Plus => Optionality::Required(ty),
                    TruePlusMinus::Minus => {
                        return self
                            .error(&anchor, DiagnosticInfoMessage::MappedTypeMinusNotSupported);
                    }
                },
                None => Optionality::Required(ty),
            };
            vs.push((key, ty));
        }

        Ok(Runtype::object(vs))
    }
    fn convert_conditional_type(
        &mut self,
        t: &TsConditionalType,
        file_name: BffFileName,
    ) -> Res<Runtype> {
        let anchor = Anchor {
            f: file_name.clone(),
            s: t.span,
        };
        let check_type_schema = self.extract_type(&t.check_type, file_name.clone())?;
        let extends_type_schema = self.extract_type(&t.extends_type, file_name.clone())?;

        let mut ctx = SemTypeContext::new();
        let validators_vec = self.validators_vec();
        let validators_reference_vec: Vec<&NamedSchema> = validators_vec.iter().collect();

        let check_type_st = check_type_schema
            .to_sem_type(&validators_reference_vec, &mut ctx)
            .map_err(|e| {
                self.box_error(&anchor, DiagnosticInfoMessage::AnyhowError(e.to_string()))
            })?;

        let extends_type_st = extends_type_schema
            .to_sem_type(&validators_reference_vec, &mut ctx)
            .map_err(|e| {
                self.box_error(&anchor, DiagnosticInfoMessage::AnyhowError(e.to_string()))
            })?;

        let is_true = check_type_st
            .is_subtype(&extends_type_st, &mut ctx)
            .map_err(|e| {
                self.box_error(&anchor, DiagnosticInfoMessage::AnyhowError(e.to_string()))
            })?;

        if is_true {
            self.extract_type(&t.true_type, file_name.clone())
        } else {
            self.extract_type(&t.false_type, file_name.clone())
        }
    }

    fn extract_type(&mut self, ty: &TsType, file: BffFileName) -> Res<Runtype> {
        let anchor = Anchor {
            f: file.clone(),
            s: ty.span(),
        };
        match ty {
            TsType::TsTypeRef(ts_type_ref) => self.extract_type_ref(ts_type_ref, file),
            TsType::TsKeywordType(ts_keyword_type) => {
                self.extract_ts_keyword_type(ts_keyword_type, file.clone())
            }
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
                            return self.error(
                                &anchor,
                                DiagnosticInfoMessage::DuplicatedRestNonSerializable,
                            );
                        }
                        let ann = match self.extract_type(type_ann, file.clone())? {
                            Runtype::Array(items) => *items,
                            _ => {
                                return self.error(
                                    &anchor,
                                    DiagnosticInfoMessage::TupleRestTypeMustBeArray,
                                );
                            }
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
            TsType::TsMappedType(ts_mapped_type) => self.convert_mapped_type(ts_mapped_type, file),
            TsType::TsConditionalType(ts_conditional_type) => {
                self.convert_conditional_type(ts_conditional_type, file)
            }
            TsType::TsTypeOperator(TsTypeOperator {
                span: _,
                op,
                type_ann,
            }) => match op {
                TsTypeOperatorOp::KeyOf => self.convert_keyof(type_ann, file.clone()),
                TsTypeOperatorOp::Unique => {
                    self.error(&anchor, DiagnosticInfoMessage::UniqueNonSerializable)
                }
                TsTypeOperatorOp::ReadOnly => self.extract_type(type_ann, file.clone()),
            },

            TsType::TsOptionalType(TsOptionalType { .. }) => {
                self.error(&anchor, DiagnosticInfoMessage::OptionalTypeIsNotSupported)
            }
            TsType::TsThisType(TsThisType { .. }) => {
                self.error(&anchor, DiagnosticInfoMessage::ThisTypeNonSerializable)
            }
            TsType::TsFnOrConstructorType(
                TsFnOrConstructorType::TsConstructorType(TsConstructorType { .. })
                | TsFnOrConstructorType::TsFnType(TsFnType { .. }),
            ) => self.error(
                &anchor,
                DiagnosticInfoMessage::TsFnOrConstructorTypeNonSerializable,
            ),
            TsType::TsInferType(TsInferType { .. }) => {
                self.error(&anchor, DiagnosticInfoMessage::TsInferTypeNonSerializable)
            }
            TsType::TsTypePredicate(TsTypePredicate { .. }) => self.error(
                &anchor,
                DiagnosticInfoMessage::TsTypePredicateNonSerializable,
            ),
            TsType::TsRestType(_) => self.error(
                &anchor,
                DiagnosticInfoMessage::AnyhowError(
                    "should have been handled by parent node".to_string(),
                ),
            ),
        }
    }

    fn extract_one_built_decoder_v2(&mut self, prop: &TsTypeElement) -> Result<BuiltDecoder> {
        let anchor = Anchor {
            f: self.parser_file.clone(),
            s: prop.span(),
        };
        match prop {
            TsTypeElement::TsPropertySignature(TsPropertySignature {
                key,
                type_ann,
                type_params,
                ..
            }) => {
                if type_params.is_some() {
                    return self.anyhow_error(
                        &anchor,
                        DiagnosticInfoMessage::GenericDecoderIsNotSupported,
                    );
                }

                let key = match &**key {
                    Expr::Ident(ident) => ident.sym.to_string(),
                    _ => {
                        return self
                            .anyhow_error(&anchor, DiagnosticInfoMessage::InvalidDecoderKey);
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
                            schema,
                        })
                    }
                    None => self.anyhow_error(
                        &anchor,
                        DiagnosticInfoMessage::DecoderMustHaveTypeAnnotation,
                    ),
                }
            }
            TsTypeElement::TsGetterSignature(TsGetterSignature { .. })
            | TsTypeElement::TsSetterSignature(TsSetterSignature { .. })
            | TsTypeElement::TsMethodSignature(TsMethodSignature { .. })
            | TsTypeElement::TsIndexSignature(TsIndexSignature { .. })
            | TsTypeElement::TsCallSignatureDecl(TsCallSignatureDecl { .. })
            | TsTypeElement::TsConstructSignatureDecl(TsConstructSignatureDecl { .. }) => {
                self.anyhow_error(&anchor, DiagnosticInfoMessage::InvalidDecoderProperty)
            }
        }
    }
    pub fn extract_built_decoders_from_call_v2(
        &mut self,
        params: &TsTypeParamInstantiation,
    ) -> Result<Vec<BuiltDecoder>> {
        let anchor = Anchor {
            f: self.parser_file.clone(),
            s: params.span,
        };
        match params.params.split_first() {
            Some((head, tail)) => {
                let anchor = Anchor {
                    f: self.parser_file.clone(),
                    s: head.span(),
                };
                if !tail.is_empty() {
                    return self
                        .anyhow_error(&anchor, DiagnosticInfoMessage::TooManyTypeParamsOnDecoder);
                }
                match &**head {
                    TsType::TsTypeLit(TsTypeLit { members, .. }) => members
                        .iter()
                        .map(|prop| self.extract_one_built_decoder_v2(prop))
                        .collect(),
                    _ => self.anyhow_error(
                        &anchor,
                        DiagnosticInfoMessage::DecoderShouldBeObjectWithTypesAndNames,
                    ),
                }
            }
            None => self.anyhow_error(&anchor, DiagnosticInfoMessage::TooFewTypeParamsOnDecoder),
        }
    }
}
