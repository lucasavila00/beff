use std::rc::Rc;

use swc_common::Span;
use swc_ecma_ast::{Expr, Ident, TsInterfaceDecl, TsType};

use crate::{
    diag::{Diagnostic, DiagnosticInfoMessage, Location},
    BffFileName, FileManager, ImportReference, ParsedModule, SymbolExport,
};

pub struct TypeResolver<'a, R: FileManager> {
    pub files: &'a mut R,
    pub current_file: BffFileName,
}

pub enum ResolvedLocalSymbol {
    TsType(Rc<TsType>),
    TsInterfaceDecl(Rc<TsInterfaceDecl>),
    Expr(Rc<Expr>),
    NamedImport {
        exported: Rc<SymbolExport>,
        from_file: Rc<ImportReference>,
    },
    // ExportDefault(Rc<Expr>),
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
    pub fn resolve_local_symbol(&mut self, i: &Ident) -> Res<ResolvedLocalSymbol> {
        let k = &(i.sym.clone(), i.span.ctxt);
        if let Some(alias) = self.get_current_file().locals.type_aliases.get(k) {
            return Ok(ResolvedLocalSymbol::TsType(alias.clone()));
        }
        if let Some(alias) = self.get_current_file().locals.exprs.get(k) {
            return Ok(ResolvedLocalSymbol::Expr(alias.clone()));
        }
        if let Some(intf) = self.get_current_file().locals.interfaces.get(k) {
            return Ok(ResolvedLocalSymbol::TsInterfaceDecl(intf.clone()));
        }
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
                ImportReference::Star { .. } => {
                    todo!()
                }
                ImportReference::Default { file_name } => {
                    let file = self.files.get_or_fetch_file(file_name);
                    let df = file.and_then(|file| file.export_default.clone());
                    match df {
                        Some(d) => return Ok(ResolvedLocalSymbol::Expr(d.symbol_export.clone())),
                        None => todo!(),
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
}
