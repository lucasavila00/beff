use std::rc::Rc;

use swc_common::Span;
use swc_ecma_ast::{
    Expr, Ident, TsEnumDecl, TsInterfaceDecl, TsType, TsTypeAliasDecl, TsTypeParamDecl,
};

use crate::{
    diag::{Diagnostic, DiagnosticInfoMessage, Location},
    BffFileName, FileManager, ImportReference, ParsedModule, SymbolExport, SymbolExportDefault,
};

pub struct TypeResolver<'a, R: FileManager> {
    pub files: &'a mut R,
    pub current_file: BffFileName,
}

pub enum TsBuiltIn {
    TsRecord(Span),
    TsOmit(Span),
    TsObject(Span),
    TsRequired(Span),
    TsPartial(Span),
    TsPick(Span),
    TsExclude(Span),
}

pub enum ResolvedLocalSymbol {
    TsType(Option<Rc<TsTypeParamDecl>>, Rc<TsType>),
    TsInterfaceDecl(Rc<TsInterfaceDecl>),
    TsEnumDecl(Rc<TsEnumDecl>),
    Expr(Rc<Expr>),
    NamedImport {
        exported: Rc<SymbolExport>,
        from_file: Rc<ImportReference>,
    },
    SymbolExportDefault(Rc<SymbolExportDefault>),
    Star(BffFileName), // ExportDefault(Rc<Expr>),
    TsBuiltin(TsBuiltIn),
}
pub struct ResolvedNamespaceSymbol {
    pub from_file: Rc<ImportReference>,
}
type Res<T> = Result<T, Box<Diagnostic>>;

impl<'a, R: FileManager> TypeResolver<'a, R> {
    pub fn new(files: &'a mut R, current_file: &BffFileName) -> TypeResolver<'a, R> {
        TypeResolver {
            files,
            current_file: current_file.clone(),
        }
    }
    fn get_current_file(&mut self) -> Rc<ParsedModule> {
        self.files
            .get_or_fetch_file(&self.current_file)
            .expect("should have been parsed")
    }
    fn resolve_export(
        &mut self,
        i: &Ident,
        export: &Rc<SymbolExport>,
        is_type: bool,
        at_file: BffFileName,
    ) -> Res<ResolvedNamespaceSymbol> {
        match &**export {
            SymbolExport::StarOfOtherFile { reference, .. } => Ok(ResolvedNamespaceSymbol {
                from_file: reference.clone(),
            }),
            SymbolExport::TsType { .. } => Err(self
                .make_err(
                    &i.span,
                    DiagnosticInfoMessage::ShouldNotResolveTsTypeAsNamespace,
                )
                .into()),
            SymbolExport::TsInterfaceDecl { .. } => Err(self
                .make_err(
                    &i.span,
                    DiagnosticInfoMessage::ShouldNotResolveTsInterfaceDeclAsNamespace,
                )
                .into()),
            SymbolExport::SomethingOfOtherFile {
                something: orig,
                file: file_name,
                ..
            } => {
                let file = self.files.get_or_fetch_file(file_name);
                let exported = file.and_then(|file| {
                    if is_type {
                        file.symbol_exports.get_type(orig, self.files)
                    } else {
                        file.symbol_exports.get_value(orig, self.files)
                    }
                });
                if let Some(export) = exported {
                    return self.resolve_export(i, &export, is_type, file_name.clone());
                }
                Err(self
                    .make_err(
                        &i.span,
                        DiagnosticInfoMessage::CannotResolveNamespaceTypeSomethingOfOtherFile,
                    )
                    .into())
            }
            SymbolExport::ValueExpr { .. } => Err(self
                .make_err(
                    &i.span,
                    DiagnosticInfoMessage::CannotResolveNamespaceTypeValueExpr,
                )
                .into()),
            SymbolExport::TsEnumDecl { decl, .. } => Ok(ResolvedNamespaceSymbol {
                from_file: ImportReference::Named {
                    original_name: i.sym.clone().to_string().into(),
                    file_name: at_file.clone(),
                    span: decl.span,
                }
                .into(),
            }),
            SymbolExport::ExprDecl { .. } => Err(self
                .make_err(
                    &i.span,
                    DiagnosticInfoMessage::CannotResolveNamespaceTypeExprDecl,
                )
                .into()),
        }
    }
    pub fn resolve_namespace_symbol(
        &mut self,
        i: &Ident,
        is_type: bool,
    ) -> Res<ResolvedNamespaceSymbol> {
        if let Some(imported) = self.get_current_file().imports.get(&i.sym.to_string()) {
            match &**imported {
                ImportReference::Default { .. } => {}
                ImportReference::Star { .. } => {
                    return Ok(ResolvedNamespaceSymbol {
                        from_file: imported.clone(),
                    })
                }
                ImportReference::Named {
                    original_name: orig,
                    file_name,
                    ..
                } => {
                    let file = self.files.get_or_fetch_file(file_name);
                    let exported = file.and_then(|file| {
                        if is_type {
                            file.symbol_exports.get_type(orig, self.files)
                        } else {
                            file.symbol_exports.get_value(orig, self.files)
                        }
                    });
                    if let Some(export) = exported {
                        return self.resolve_export(i, &export, is_type, file_name.clone());
                    }
                }
            }
        }

        Err(self
            .make_err(
                &i.span,
                DiagnosticInfoMessage::CannotResolveNamespaceTypeNamespaceSymbol,
            )
            .into())
    }

    fn make_err(&mut self, span: &Span, info_msg: DiagnosticInfoMessage) -> Diagnostic {
        let file = self.files.get_or_fetch_file(&self.current_file);
        Location::build(file, span, &self.current_file)
            .to_info(info_msg)
            .to_diag(None)
    }
    fn resolve_local_import(&mut self, i: &Ident, is_type: bool) -> Res<ResolvedLocalSymbol> {
        if let Some(imported) = self.get_current_file().imports.get(&i.sym.to_string()) {
            match &**imported {
                ImportReference::Named {
                    original_name: orig,
                    file_name,
                    ..
                } => {
                    let file = self.files.get_or_fetch_file(file_name);
                    let exported = file.and_then(|file| {
                        if is_type {
                            file.symbol_exports.get_type(orig, self.files)
                        } else {
                            file.symbol_exports.get_value(orig, self.files)
                        }
                    });
                    if let Some(exported) = exported {
                        return Ok(ResolvedLocalSymbol::NamedImport {
                            exported: exported.clone(),
                            from_file: imported.clone(),
                        });
                    }
                }
                ImportReference::Star { file_name, .. } => {
                    return Ok(ResolvedLocalSymbol::Star(file_name.clone()));
                }
                ImportReference::Default { file_name } => {
                    let file = self.files.get_or_fetch_file(file_name);
                    let df = file.and_then(|file| file.export_default.clone());
                    match df {
                        Some(d) => return Ok(ResolvedLocalSymbol::SymbolExportDefault(d.clone())),
                        None => {
                            return Err(self
                                .make_err(&i.span, DiagnosticInfoMessage::ExportDefaultNotFound)
                                .into())
                        }
                    }
                }
            }
        }

        match i.sym.as_ref() {
            "Record" => {
                return Ok(ResolvedLocalSymbol::TsBuiltin(TsBuiltIn::TsRecord(i.span)));
            }
            "Object" => {
                return Ok(ResolvedLocalSymbol::TsBuiltin(TsBuiltIn::TsObject(i.span)));
            }
            "Omit" => {
                return Ok(ResolvedLocalSymbol::TsBuiltin(TsBuiltIn::TsOmit(i.span)));
            }
            "Exclude" => {
                return Ok(ResolvedLocalSymbol::TsBuiltin(TsBuiltIn::TsExclude(i.span)));
            }
            "Pick" => {
                return Ok(ResolvedLocalSymbol::TsBuiltin(TsBuiltIn::TsPick(i.span)));
            }
            "Required" => {
                return Ok(ResolvedLocalSymbol::TsBuiltin(TsBuiltIn::TsRequired(
                    i.span,
                )));
            }
            "Partial" => {
                return Ok(ResolvedLocalSymbol::TsBuiltin(TsBuiltIn::TsPartial(i.span)));
            }
            _ => {}
        }

        Err(self
            .make_err(
                &i.span,
                DiagnosticInfoMessage::CannotResolveLocalSymbol(i.sym.to_string()),
            )
            .into())
    }
    pub fn resolve_local_value(&mut self, i: &Ident) -> Res<ResolvedLocalSymbol> {
        if let Some(alias) = self.get_current_file().locals.exprs.get(&i.sym.to_string()) {
            return Ok(ResolvedLocalSymbol::Expr(alias.clone()));
        }

        if let Some(enum_) = self.get_current_file().locals.enums.get(&i.sym.to_string()) {
            return Ok(ResolvedLocalSymbol::TsEnumDecl(enum_.clone()));
        }

        if let Some(exported) = self
            .get_current_file()
            .symbol_exports
            .named_values
            .get(&i.sym.to_string())
        {
            match exported.as_ref() {
                SymbolExport::ValueExpr { expr, .. } => {
                    return Ok(ResolvedLocalSymbol::Expr(expr.clone()));
                }
                SymbolExport::TsType { .. }
                | SymbolExport::TsEnumDecl { .. }
                | SymbolExport::TsInterfaceDecl { .. }
                | SymbolExport::ExprDecl { .. }
                | SymbolExport::StarOfOtherFile { .. }
                | SymbolExport::SomethingOfOtherFile { .. } => {}
            }
        }

        self.resolve_local_import(i, false)
    }
    pub fn resolve_local_type(&mut self, i: &Ident) -> Res<ResolvedLocalSymbol> {
        if let Some(ts_type) = self
            .get_current_file()
            .locals
            .type_aliases
            .get(&i.sym.to_string())
        {
            let TsTypeAliasDecl {
                type_ann: ty,
                type_params: params,
                ..
            } = ts_type.as_ref();
            return Ok(ResolvedLocalSymbol::TsType(
                params.clone().as_ref().map(|it| it.as_ref().clone().into()),
                ty.clone().into(),
            ));
        }

        if let Some(intf) = self
            .get_current_file()
            .locals
            .interfaces
            .get(&i.sym.to_string())
        {
            return Ok(ResolvedLocalSymbol::TsInterfaceDecl(intf.clone()));
        }
        if let Some(enum_) = self.get_current_file().locals.enums.get(&i.sym.to_string()) {
            return Ok(ResolvedLocalSymbol::TsEnumDecl(enum_.clone()));
        }

        self.resolve_local_import(i, true)
    }
}
