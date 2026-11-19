use super::{FrontendCtx, Res};
use crate::diag::DiagnosticInfoMessage;
use crate::swc_tools::{SymbolExport, SymbolExportDefault};
use crate::{
    Anchor, BffFileName, FileManager, ImportReference, ModuleItemAddress, ParsedModule,
    TypeAddress, Visibility,
};
use std::rc::Rc;
use swc_common::Span;
use swc_ecma_ast::{Expr, TsEnumDecl, TsInterfaceDecl, TsType, TsTypeAliasDecl};

#[derive(Debug)]
pub(super) enum AddressedType {
    Type {
        t: Rc<TsTypeAliasDecl>,
        local_address: TypeAddress,
        declaration_span: Span,
    },
    Interface {
        t: Rc<TsInterfaceDecl>,
        local_address: TypeAddress,
        declaration_span: Span,
    },
    Enum {
        t: Rc<TsEnumDecl>,
        local_address: TypeAddress,
    },
}
impl AddressedType {
    pub(super) fn type_address(&self) -> TypeAddress {
        match self {
            AddressedType::Type {
                t: _,
                local_address: address,
                declaration_span: _,
            } => address.clone(),
            AddressedType::Interface {
                t: _,
                local_address: address,
                declaration_span: _,
            } => address.clone(),
            AddressedType::Enum {
                t: _,
                local_address: address,
            } => address.clone(),
        }
    }
}

pub(super) enum AddressedQualifiedType {
    StarImport(BffFileName),
    WillBeUsedForEnumItem {
        enum_type: Rc<TsEnumDecl>,
        address: TypeAddress,
    },
}

pub(super) enum AddressedValue {
    ValueExpr(Rc<Expr>, BffFileName),
    TypeDecl(Rc<TsType>, BffFileName),
    Enum(Rc<TsEnumDecl>, BffFileName),
    StarOfFile(BffFileName),
}

#[derive(Debug)]
pub(super) enum AddressedQualifiedValue {
    StarOfFile(BffFileName),
    ValueExpr(Rc<Expr>, BffFileName),
    ExprDecl(Rc<TsType>, BffFileName),
    MemberExpr {
        base: Box<AddressedQualifiedValue>,
        member: String,
    },
    Enum(Rc<TsEnumDecl>, BffFileName),
}

impl From<AddressedValue> for AddressedQualifiedValue {
    fn from(value: AddressedValue) -> Self {
        match value {
            AddressedValue::ValueExpr(expr, file) => AddressedQualifiedValue::ValueExpr(expr, file),
            AddressedValue::TypeDecl(ty, file) => AddressedQualifiedValue::ExprDecl(ty, file),
            AddressedValue::Enum(decl, file) => AddressedQualifiedValue::Enum(decl, file),
            AddressedValue::StarOfFile(file) => AddressedQualifiedValue::StarOfFile(file),
        }
    }
}

/// Finds the declaration that a `ModuleItemAddress` refers to. It follows imports and re-exports.
/// The walkers differ in the declarations they accept and in the errors they report.
trait ModuleWalker<'a, R: FileManager + 'a, U> {
    fn get_ctx<'b>(&'b mut self) -> &'b mut FrontendCtx<'a, R>;

    fn handle_import_star(&mut self, file_name: BffFileName, anchor: &Anchor) -> Res<U>;

    fn get_addressed_item_from_symbol_export(
        &mut self,
        export: &SymbolExport,
        anchor: &Anchor,
    ) -> Res<U>;

    /// The item of `export default <expr>`, when the expression is not an identifier.
    fn get_addressed_item_from_default_expr(
        &mut self,
        expr: &Rc<Expr>,
        anchor: &Anchor,
    ) -> Res<U>;

    /// The item that the module declares or imports with the name of `addr`, if there is one.
    fn get_addressed_local_item(
        &mut self,
        parsed_module: &ParsedModule,
        addr: &ModuleItemAddress,
        anchor: &Anchor,
    ) -> Option<Res<U>>;

    fn get_symbol_export(
        &mut self,
        parsed_module: &ParsedModule,
        addr: &ModuleItemAddress,
    ) -> Option<Rc<SymbolExport>>;

    fn cannot_resolve(addr: ModuleItemAddress) -> DiagnosticInfoMessage;

    fn get_addressed_exported_item(
        &mut self,
        file: &BffFileName,
        name: &str,
        anchor: &Anchor,
    ) -> Res<U> {
        let new_addr = ModuleItemAddress {
            file: file.clone(),
            name: name.to_string(),
            visibility: Visibility::Export,
        };
        self.get_addressed_item(&new_addr, anchor)
    }

    fn get_addressed_item_from_default_import(
        &mut self,
        file_name: BffFileName,
        err_anchor: &Anchor,
        import_statement_anchor: &Anchor,
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
                        self.get_addressed_item(&new_addr, anchor)
                    }
                    _ => self.get_addressed_item_from_default_expr(symbol_export, anchor),
                },
                SymbolExportDefault::Renamed { export } => {
                    self.get_addressed_item_from_symbol_export(export, err_anchor)
                }
            },
            None => self.get_ctx().error(
                import_statement_anchor,
                Self::cannot_resolve(ModuleItemAddress {
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
        err_anchor: &Anchor,
    ) -> Res<U> {
        match imported {
            ImportReference::Named {
                original_name,
                file_name,
                import_statement_anchor: import_st_anchor,
            } => self.get_addressed_exported_item(file_name, original_name, import_st_anchor),
            ImportReference::Star {
                file_name,
            } => self.handle_import_star(file_name.clone(), err_anchor),
            ImportReference::Default {
                file_name,
                import_statement_anchor,
            } => self.get_addressed_item_from_default_import(
                file_name.clone(),
                err_anchor,
                import_statement_anchor,
            ),
        }
    }

    fn get_addressed_item(&mut self, addr: &ModuleItemAddress, err_anchor: &Anchor) -> Res<U> {
        let parsed_module = self.get_ctx().get_or_fetch_file(&addr.file, err_anchor)?;
        match addr.visibility {
            Visibility::Local => {
                if let Some(item) = self.get_addressed_local_item(&parsed_module, addr, err_anchor)
                {
                    return item;
                }
            }
            Visibility::Export => {
                if addr.name == "default" {
                    return self.get_addressed_item_from_default_import(
                        addr.file.clone(),
                        err_anchor,
                        err_anchor,
                    );
                }

                if let Some(export) = self.get_symbol_export(&parsed_module, addr) {
                    return self.get_addressed_item_from_symbol_export(&export, err_anchor);
                }
            }
        }
        self.get_ctx()
            .error(err_anchor, Self::cannot_resolve(addr.clone()))
    }
}

struct TypeWalker<'a, 'b, R: FileManager> {
    ctx: &'b mut FrontendCtx<'a, R>,
}
struct QualifiedTypeWalker<'a, 'b, R: FileManager> {
    ctx: &'b mut FrontendCtx<'a, R>,
}

impl<'a, 'b, R: FileManager> ModuleWalker<'a, R, AddressedType> for TypeWalker<'a, 'b, R> {
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
                span,
            } => Ok(AddressedType::Type {
                t: decl.clone(),
                local_address: TypeAddress {
                    file: original_file.clone(),
                    name: name.clone(),
                },
                declaration_span: *span,
            }),
            SymbolExport::TsInterfaceDecl {
                decl,
                original_file,
                span,
            } => Ok(AddressedType::Interface {
                t: decl.clone(),
                local_address: TypeAddress {
                    file: original_file.clone(),
                    name: decl.id.sym.to_string(),
                },
                declaration_span: *span,
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
            SymbolExport::ExprDecl { .. } | SymbolExport::ValueExpr { .. } => self
                .get_ctx()
                .error(anchor, DiagnosticInfoMessage::CannotUseValueInTypePosition),
            SymbolExport::StarOfOtherFile { .. } => self.get_ctx().error(
                anchor,
                DiagnosticInfoMessage::CannotUseStarImportInTypePosition,
            ),
            SymbolExport::SomethingOfOtherFile { something, file } => {
                self.get_addressed_exported_item(file, something, anchor)
            }
        }
    }

    fn get_addressed_item_from_default_expr(
        &mut self,
        _expr: &Rc<Expr>,
        anchor: &Anchor,
    ) -> Res<AddressedType> {
        self.ctx
            .error(anchor, DiagnosticInfoMessage::ExpressionIsNotAType)
    }

    fn get_addressed_local_item(
        &mut self,
        parsed_module: &ParsedModule,
        addr: &ModuleItemAddress,
        anchor: &Anchor,
    ) -> Option<Res<AddressedType>> {
        let local_address = TypeAddress {
            file: addr.file.clone(),
            name: addr.name.clone(),
        };
        if let Some(ts_type) = parsed_module.locals.type_aliases.get(&addr.name) {
            return Some(Ok(AddressedType::Type {
                t: ts_type.clone(),
                local_address,
                declaration_span: ts_type.span,
            }));
        }
        if let Some(ts_enum) = parsed_module.locals.enums.get(&addr.name) {
            return Some(Ok(AddressedType::Enum {
                t: ts_enum.clone(),
                local_address,
            }));
        }
        if let Some(ts_interface) = parsed_module.locals.interfaces.get(&addr.name) {
            return Some(Ok(AddressedType::Interface {
                t: ts_interface.clone(),
                local_address,
                declaration_span: ts_interface.span,
            }));
        }
        let imported = parsed_module.imports.get(&addr.name)?;
        Some(self.get_addressed_item_from_import_reference(imported, anchor))
    }

    fn get_symbol_export(
        &mut self,
        parsed_module: &ParsedModule,
        addr: &ModuleItemAddress,
    ) -> Option<Rc<SymbolExport>> {
        parsed_module
            .symbol_exports
            .get_type(&addr.name, self.ctx.files)
    }

    fn cannot_resolve(addr: ModuleItemAddress) -> DiagnosticInfoMessage {
        DiagnosticInfoMessage::CannotNotResolveType(addr)
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
}

impl<'a, 'b, R: FileManager> ModuleWalker<'a, R, AddressedQualifiedType>
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
            } => Ok(AddressedQualifiedType::WillBeUsedForEnumItem {
                enum_type: decl.clone(),
                address: TypeAddress {
                    file: original_file.clone(),
                    name: decl.id.sym.to_string(),
                },
            }),
            SymbolExport::SomethingOfOtherFile { something, file } => {
                // TODO: test this without just the JS test
                self.get_addressed_exported_item(file, something, anchor)
            }
            SymbolExport::TsType { .. } => self.ctx.error(
                anchor,
                DiagnosticInfoMessage::CannotUseTypeInQualifiedTypePosition,
            ),
            SymbolExport::TsInterfaceDecl { .. } => self.ctx.error(
                anchor,
                DiagnosticInfoMessage::CannotUseInterfaceInQualifiedTypePosition,
            ),
            SymbolExport::ValueExpr { .. } => {
                unreachable!("we use get_type which filters these out")
            }
            SymbolExport::ExprDecl { .. } => {
                unreachable!("we use get_type which filters these out")
            }
        }
    }

    fn get_addressed_item_from_default_expr(
        &mut self,
        _expr: &Rc<Expr>,
        anchor: &Anchor,
    ) -> Res<AddressedQualifiedType> {
        self.ctx
            .error(anchor, DiagnosticInfoMessage::ExpressionIsNotAType)
    }

    fn get_addressed_local_item(
        &mut self,
        parsed_module: &ParsedModule,
        addr: &ModuleItemAddress,
        anchor: &Anchor,
    ) -> Option<Res<AddressedQualifiedType>> {
        if parsed_module.locals.type_aliases.contains_key(&addr.name) {
            return Some(self.ctx.error(
                anchor,
                DiagnosticInfoMessage::CannotUseTypeInQualifiedTypePosition,
            ));
        }
        if let Some(ts_enum) = parsed_module.locals.enums.get(&addr.name) {
            return Some(Ok(AddressedQualifiedType::WillBeUsedForEnumItem {
                enum_type: ts_enum.clone(),
                address: TypeAddress {
                    file: addr.file.clone(),
                    name: addr.name.clone(),
                },
            }));
        }
        if parsed_module.locals.interfaces.contains_key(&addr.name) {
            return Some(self.ctx.error(
                anchor,
                DiagnosticInfoMessage::CannotUseInterfaceInQualifiedTypePosition,
            ));
        }
        let imported = parsed_module.imports.get(&addr.name)?;
        Some(self.get_addressed_item_from_import_reference(imported, anchor))
    }

    fn get_symbol_export(
        &mut self,
        parsed_module: &ParsedModule,
        addr: &ModuleItemAddress,
    ) -> Option<Rc<SymbolExport>> {
        parsed_module
            .symbol_exports
            .get_type(&addr.name, self.ctx.files)
    }

    fn cannot_resolve(addr: ModuleItemAddress) -> DiagnosticInfoMessage {
        DiagnosticInfoMessage::CannotNotResolveType(addr)
    }

    fn handle_import_star(
        &mut self,
        file_name: BffFileName,
        _anchor: &Anchor,
    ) -> Res<AddressedQualifiedType> {
        Ok(AddressedQualifiedType::StarImport(file_name))
    }
}

struct ValueWalker<'a, 'b, R: FileManager> {
    ctx: &'b mut FrontendCtx<'a, R>,
    /// True when the item is the left side of a qualified name or of a member access.
    /// The caller then converts the item to an `AddressedQualifiedValue`.
    qualified: bool,
}

impl<'a, 'b, R: FileManager> ModuleWalker<'a, R, AddressedValue> for ValueWalker<'a, 'b, R> {
    fn get_ctx<'c>(&'c mut self) -> &'c mut FrontendCtx<'a, R> {
        self.ctx
    }

    fn get_addressed_item_from_symbol_export(
        &mut self,
        export: &SymbolExport,
        anchor: &Anchor,
    ) -> Res<AddressedValue> {
        match export {
            SymbolExport::TsType { .. } | SymbolExport::TsInterfaceDecl { .. }
                if self.qualified =>
            {
                unreachable!("we use get_value wich filters these out")
            }
            SymbolExport::TsType { .. } => self
                .get_ctx()
                .error(anchor, DiagnosticInfoMessage::CannotUseTypeInValuePosition),
            SymbolExport::TsInterfaceDecl { .. } => self.get_ctx().error(
                anchor,
                DiagnosticInfoMessage::CannotUseInterfaceInValuePosition,
            ),
            SymbolExport::TsEnumDecl {
                decl,
                original_file,
            } => Ok(AddressedValue::Enum(decl.clone(), original_file.clone())),
            SymbolExport::ValueExpr {
                expr,
                original_file,
            } => Ok(AddressedValue::ValueExpr(
                expr.clone(),
                original_file.clone(),
            )),
            SymbolExport::ExprDecl {
                original_file,
                ty,
            } => Ok(AddressedValue::TypeDecl(ty.clone(), original_file.clone())),

            SymbolExport::StarOfOtherFile { reference } => {
                self.get_addressed_item_from_import_reference(reference.as_ref(), anchor)
            }
            SymbolExport::SomethingOfOtherFile { something, file } => {
                self.get_addressed_exported_item(file, something, anchor)
            }
        }
    }

    fn get_addressed_item_from_default_expr(
        &mut self,
        expr: &Rc<Expr>,
        anchor: &Anchor,
    ) -> Res<AddressedValue> {
        Ok(AddressedValue::ValueExpr(expr.clone(), anchor.f.clone()))
    }

    fn get_addressed_local_item(
        &mut self,
        parsed_module: &ParsedModule,
        addr: &ModuleItemAddress,
        anchor: &Anchor,
    ) -> Option<Res<AddressedValue>> {
        if let Some(imported) = parsed_module.imports.get(&addr.name) {
            return Some(self.get_addressed_item_from_import_reference(imported, anchor));
        }
        let file = addr.file.clone();
        if let Some(decl_expr) = parsed_module.locals.exprs_decls.get(&addr.name) {
            return Some(Ok(AddressedValue::TypeDecl(decl_expr.clone(), file)));
        }
        if let Some(expr) = parsed_module.locals.exprs.get(&addr.name) {
            return Some(Ok(AddressedValue::ValueExpr(expr.clone(), file)));
        }
        if let Some(enum_) = parsed_module.locals.enums.get(&addr.name) {
            return Some(Ok(AddressedValue::Enum(enum_.clone(), file)));
        }
        None
    }

    fn get_symbol_export(
        &mut self,
        parsed_module: &ParsedModule,
        addr: &ModuleItemAddress,
    ) -> Option<Rc<SymbolExport>> {
        parsed_module
            .symbol_exports
            .get_value(&addr.name, self.ctx.files)
    }

    fn cannot_resolve(addr: ModuleItemAddress) -> DiagnosticInfoMessage {
        DiagnosticInfoMessage::CannotNotResolveValue(addr)
    }

    fn handle_import_star(
        &mut self,
        file_name: BffFileName,
        _anchor: &Anchor,
    ) -> Res<AddressedValue> {
        Ok(AddressedValue::StarOfFile(file_name))
    }
}

impl<'a, R: FileManager> FrontendCtx<'a, R> {
    pub(super) fn get_addressed_type(
        &mut self,
        addr: &ModuleItemAddress,
        anchor: &Anchor,
    ) -> Res<AddressedType> {
        let mut walker = TypeWalker { ctx: self };
        walker.get_addressed_item(addr, anchor)
    }

    pub(super) fn get_addressed_qualified_type(
        &mut self,
        addr: &ModuleItemAddress,
        anchor: &Anchor,
    ) -> Res<AddressedQualifiedType> {
        let mut walker = QualifiedTypeWalker { ctx: self };
        walker.get_addressed_item(addr, anchor)
    }

    pub(super) fn get_addressed_value(
        &mut self,
        addr: &ModuleItemAddress,
        anchor: &Anchor,
    ) -> Res<AddressedValue> {
        let mut walker = ValueWalker {
            ctx: self,
            qualified: false,
        };
        walker.get_addressed_item(addr, anchor)
    }

    pub(super) fn get_addressed_qualified_value(
        &mut self,
        addr: &ModuleItemAddress,
        anchor: &Anchor,
    ) -> Res<AddressedQualifiedValue> {
        let mut walker = ValueWalker {
            ctx: self,
            qualified: true,
        };
        Ok(walker.get_addressed_item(addr, anchor)?.into())
    }

    pub(super) fn get_addressed_value_from_symbol_export(
        &mut self,
        export: &SymbolExport,
        anchor: &Anchor,
    ) -> Res<AddressedValue> {
        let mut walker = ValueWalker {
            ctx: self,
            qualified: false,
        };
        walker.get_addressed_item_from_symbol_export(export, anchor)
    }
}
