use std::rc::Rc;

use swc_ecma_ast::{Ident, TsInterfaceDecl, TsType};

use crate::{
    api_extractor::FileManager, diag::Diagnostic, BffFileName, ImportReference, ParsedModule,
    TypeExport,
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

pub enum ResolvedNamespaceType {
    Star { from_file: Rc<ImportReference> },
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
    pub fn resolve_namespace_type(&mut self, i: &Ident) -> Res<ResolvedNamespaceType> {
        let k = &(i.sym.clone(), i.span.ctxt);

        if let Some(imported) = self.get_current_file().imports.get(k) {
            match &**imported {
                ImportReference::Star { .. } => {
                    return Ok(ResolvedNamespaceType::Star {
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
                    match exported {
                        Some(export) => match &*export {
                            TypeExport::StarOfOtherFile(reference) => {
                                return Ok(ResolvedNamespaceType::Star {
                                    from_file: reference.clone(),
                                })
                            }
                            TypeExport::TsType(_) => todo!(),
                            TypeExport::TsInterfaceDecl(_) => todo!(),
                            TypeExport::SomethingOfOtherFile(_, _) => todo!(),
                        },
                        None => todo!(),
                    }
                }
                ImportReference::Default { .. } => panic!(),
            }
        }
        todo!()
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
                        None => todo!(),
                    }
                }
                ImportReference::Star { .. } => panic!("cannot be used like that"),
                ImportReference::Default { .. } => panic!("cannot be used like that"),
            }
        }
        todo!()
    }
}
