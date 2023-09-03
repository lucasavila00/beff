use std::rc::Rc;

use swc_common::Span;
use swc_ecma_ast::{Ident, TsInterfaceDecl, TsType};

use crate::{
    api_extractor::FileManager,
    diag::{span_to_loc, Diagnostic, DiagnosticInfoMessage, DiagnosticInformation},
    BffFileName, ImportReference, ParsedModule, TypeExport,
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

pub struct ResolvedNamespaceType {
    pub from_file: Rc<ImportReference>,
}
type Res<T> = Result<T, Diagnostic>;

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
            TypeExport::StarOfOtherFile(reference) => {
                return Ok(ResolvedNamespaceType {
                    from_file: reference.clone(),
                })
            }
            TypeExport::TsType { .. } => {
                return Err(self.make_err(
                    &i.span,
                    DiagnosticInfoMessage::ShouldNotResolveTsTypeAsNamespace,
                ))
            }
            TypeExport::TsInterfaceDecl(_) => {
                return Err(self.make_err(
                    &i.span,
                    DiagnosticInfoMessage::ShouldNotResolveTsInterfaceDeclAsNamespace,
                ))
            }
            TypeExport::SomethingOfOtherFile(orig, file_name) => {
                let file = self.files.get_or_fetch_file(&file_name);
                let exported = file.and_then(|file| {
                    file.type_exports
                        .get(&orig, self.files)
                        .map(|it| it.clone())
                });
                if let Some(export) = exported {
                    return self.resolve_export(i, &export);
                }
                return Err(
                    self.make_err(&i.span, DiagnosticInfoMessage::CannotResolveNamespaceType)
                );
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
                    let file = self.files.get_or_fetch_file(&file_name);
                    let exported = file.and_then(|file| {
                        file.type_exports
                            .get(&orig, self.files)
                            .map(|it| it.clone())
                    });
                    if let Some(export) = exported {
                        return self.resolve_export(i, &export);
                    }
                }
            }
        }

        return Err(self.make_err(&i.span, DiagnosticInfoMessage::CannotResolveNamespaceType));
    }

    fn make_err(&mut self, span: &Span, info_msg: DiagnosticInfoMessage) -> Diagnostic {
        let file = self.files.get_or_fetch_file(&self.current_file);
        match file {
            Some(file) => {
                let (loc_lo, loc_hi) =
                    span_to_loc(span, &file.module.source_map, file.module.fm.end_pos);

                DiagnosticInformation::KnownFile {
                    message: info_msg,
                    file_name: self.current_file.clone(),
                    loc_lo,
                    loc_hi,
                }
            }
            None => DiagnosticInformation::UnfoundFile {
                message: info_msg,
                current_file: self.current_file.clone(),
            },
        }
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
                    let file = self.files.get_or_fetch_file(&file_name);
                    let exported = file.and_then(|file| {
                        file.type_exports
                            .get(&orig, self.files)
                            .map(|it| it.clone())
                    });
                    match exported {
                        Some(exported) => {
                            return Ok(ResolvedLocalType::NamedImport {
                                exported: exported.clone(),
                                from_file: imported.clone(),
                            });
                        }
                        None => {}
                    }
                }
                ImportReference::Star { .. } => {}
                ImportReference::Default { .. } => {}
            }
        }

        Err(self.make_err(&i.span, DiagnosticInfoMessage::CannotResolveLocalType))
    }
}
