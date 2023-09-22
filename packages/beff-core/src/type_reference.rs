use std::rc::Rc;

use swc_common::Span;
use swc_ecma_ast::{Expr, Ident, TsInterfaceDecl, TsType};

use crate::{
    diag::{Diagnostic, DiagnosticInfoMessage, Location},
    BffFileName, FileManager, ImportReference, ParsedModule, TypeExport,
};

pub struct TypeResolver<'a, R: FileManager> {
    pub files: &'a mut R,
    pub current_file: BffFileName,
}

pub enum ResolvedLocalType {
    TsType(Rc<TsType>),
    TsInterfaceDecl(Rc<TsInterfaceDecl>),
    NamedImport {
        exported: Rc<TypeExport>,
        from_file: Rc<ImportReference>,
    },
}
pub enum ResolvedLocalExpr {
    Expr(Rc<Expr>),
}
pub struct ResolvedNamespaceType {
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
    fn resolve_export(&mut self, i: &Ident, export: &Rc<TypeExport>) -> Res<ResolvedNamespaceType> {
        match &**export {
            TypeExport::StarOfOtherFile(reference) => Ok(ResolvedNamespaceType {
                from_file: reference.clone(),
            }),
            TypeExport::TsType { .. } => Err(self
                .make_err(
                    &i.span,
                    DiagnosticInfoMessage::ShouldNotResolveTsTypeAsNamespace,
                )
                .into()),
            TypeExport::TsInterfaceDecl(_) => Err(self
                .make_err(
                    &i.span,
                    DiagnosticInfoMessage::ShouldNotResolveTsInterfaceDeclAsNamespace,
                )
                .into()),
            TypeExport::SomethingOfOtherFile(orig, file_name) => {
                let file = self.files.get_or_fetch_file(file_name);
                let exported = file.and_then(|file| file.type_exports.get(orig, self.files));
                if let Some(export) = exported {
                    return self.resolve_export(i, &export);
                }
                Err(self
                    .make_err(&i.span, DiagnosticInfoMessage::CannotResolveNamespaceType)
                    .into())
            }
        }
    }
    pub fn resolve_namespace_type(&mut self, i: &Ident) -> Res<ResolvedNamespaceType> {
        let k = &(i.sym.clone(), i.span.ctxt);

        if let Some(imported) = self.get_current_file().imports.get(k) {
            match &**imported {
                ImportReference::Default { .. } => {}
                ImportReference::Star { .. } => {
                    return Ok(ResolvedNamespaceType {
                        from_file: imported.clone(),
                    })
                }
                ImportReference::Named { orig, file_name } => {
                    let file = self.files.get_or_fetch_file(file_name);
                    let exported = file.and_then(|file| file.type_exports.get(orig, self.files));
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
    pub fn resolve_local_type(&mut self, i: &Ident) -> Res<ResolvedLocalType> {
        let k = &(i.sym.clone(), i.span.ctxt);
        if let Some(alias) = self.get_current_file().locals.type_aliases.get(k) {
            return Ok(ResolvedLocalType::TsType(alias.clone()));
        }
        if let Some(intf) = self.get_current_file().locals.interfaces.get(k) {
            return Ok(ResolvedLocalType::TsInterfaceDecl(intf.clone()));
        }
        if let Some(imported) = self.get_current_file().imports.get(k) {
            match &**imported {
                ImportReference::Named { orig, file_name } => {
                    let file = self.files.get_or_fetch_file(file_name);
                    let exported = file.and_then(|file| file.type_exports.get(orig, self.files));
                    if let Some(exported) = exported {
                        return Ok(ResolvedLocalType::NamedImport {
                            exported: exported.clone(),
                            from_file: imported.clone(),
                        });
                    }
                }
                ImportReference::Star { .. } => {}
                ImportReference::Default { .. } => {}
            }
        }

        Err(self
            .make_err(
                &i.span,
                DiagnosticInfoMessage::CannotResolveLocalType(i.sym.to_string()),
            )
            .into())
    }

    pub fn resolve_local_ident(&mut self, i: &Ident) -> Res<ResolvedLocalExpr> {
        let k = &(i.sym.clone(), i.span.ctxt);
        if let Some(alias) = self.get_current_file().locals.exprs.get(k) {
            return Ok(ResolvedLocalExpr::Expr(alias.clone()));
        }

        todo!()
    }
}
