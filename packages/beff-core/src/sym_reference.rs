use std::rc::Rc;

use swc_common::Span;
use swc_ecma_ast::{Expr, Ident, TsInterfaceDecl, TsType, TsTypeParamDecl};

use crate::{
    diag::{Diagnostic, DiagnosticInfoMessage, Location},
    BffFileName, FileManager, ImportReference, ParsedModule, SymbolExport, SymbolExportDefault,
};

pub struct TypeResolver<'a, R: FileManager> {
    pub files: &'a mut R,
    pub current_file: BffFileName,
}

pub enum ResolvedLocalSymbol {
    TsType(Option<Rc<TsTypeParamDecl>>, Rc<TsType>),
    TsInterfaceDecl(Rc<TsInterfaceDecl>),
    Expr(Rc<Expr>),
    NamedImport {
        exported: Rc<SymbolExport>,
        from_file: Rc<ImportReference>,
    },
    SymbolExportDefault(Rc<SymbolExportDefault>),
    Star(BffFileName), // ExportDefault(Rc<Expr>),
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
    ) -> Res<ResolvedNamespaceSymbol> {
        match &**export {
            SymbolExport::StarOfOtherFile(reference) => Ok(ResolvedNamespaceSymbol {
                from_file: reference.clone(),
            }),
            SymbolExport::TsType { .. } => Err(self
                .make_err(
                    &i.span,
                    DiagnosticInfoMessage::ShouldNotResolveTsTypeAsNamespace,
                )
                .into()),
            SymbolExport::TsInterfaceDecl(_) => Err(self
                .make_err(
                    &i.span,
                    DiagnosticInfoMessage::ShouldNotResolveTsInterfaceDeclAsNamespace,
                )
                .into()),
            SymbolExport::SomethingOfOtherFile(orig, file_name) => {
                let file = self.files.get_or_fetch_file(file_name);
                let exported = file.and_then(|file| file.symbol_exports.get(orig, self.files));
                if let Some(export) = exported {
                    return self.resolve_export(i, &export);
                }
                Err(self
                    .make_err(&i.span, DiagnosticInfoMessage::CannotResolveNamespaceType)
                    .into())
            }
            SymbolExport::ValueExpr { .. } => todo!(),
        }
    }
    pub fn resolve_namespace_type(&mut self, i: &Ident) -> Res<ResolvedNamespaceSymbol> {
        let k = &(i.sym.clone(), i.span.ctxt);

        if let Some(imported) = self.get_current_file().imports.get(k) {
            match &**imported {
                ImportReference::Default { .. } => {}
                ImportReference::Star { .. } => {
                    return Ok(ResolvedNamespaceSymbol {
                        from_file: imported.clone(),
                    })
                }
                ImportReference::Named { orig, file_name } => {
                    let file = self.files.get_or_fetch_file(file_name);
                    let exported = file.and_then(|file| file.symbol_exports.get(orig, self.files));
                    if let Some(export) = exported {
                        return self.resolve_export(i, &export);
                    }
                }
            }
        }

        Err(self
            .make_err(&i.span, DiagnosticInfoMessage::CannotResolveNamespaceType)
            .into())
    }

    fn make_err(&mut self, span: &Span, info_msg: DiagnosticInfoMessage) -> Diagnostic {
        let file = self.files.get_or_fetch_file(&self.current_file);
        Location::build(file, span, &self.current_file)
            .to_info(info_msg)
            .to_diag(None)
    }
    fn resolve_local_import(&mut self, i: &Ident) -> Res<ResolvedLocalSymbol> {
        let k = &(i.sym.clone(), i.span.ctxt);
        if let Some(imported) = self.get_current_file().imports.get(k) {
            match &**imported {
                ImportReference::Named { orig, file_name } => {
                    let file = self.files.get_or_fetch_file(file_name);
                    let exported = file.and_then(|file| file.symbol_exports.get(orig, self.files));
                    if let Some(exported) = exported {
                        return Ok(ResolvedLocalSymbol::NamedImport {
                            exported: exported.clone(),
                            from_file: imported.clone(),
                        });
                    }
                }
                ImportReference::Star { file_name } => {
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

        Err(self
            .make_err(
                &i.span,
                DiagnosticInfoMessage::CannotResolveLocalSymbol(i.sym.to_string()),
            )
            .into())
    }
    pub fn resolve_local_value(&mut self, i: &Ident) -> Res<ResolvedLocalSymbol> {
        let k = &(i.sym.clone(), i.span.ctxt);

        if let Some(alias) = self.get_current_file().locals.exprs.get(k) {
            return Ok(ResolvedLocalSymbol::Expr(alias.clone()));
        }
        self.resolve_local_import(i)
    }
    pub fn resolve_local_type(&mut self, i: &Ident) -> Res<ResolvedLocalSymbol> {
        let k = &(i.sym.clone(), i.span.ctxt);
        if let Some((a, b)) = self.get_current_file().locals.type_aliases.get(k) {
            return Ok(ResolvedLocalSymbol::TsType(a.clone(), b.clone()));
        }

        if let Some(intf) = self.get_current_file().locals.interfaces.get(k) {
            return Ok(ResolvedLocalSymbol::TsInterfaceDecl(intf.clone()));
        }
        self.resolve_local_import(i)
    }
}
