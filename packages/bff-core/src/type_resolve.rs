use std::rc::Rc;

use swc_ecma_ast::{Ident, TsInterfaceDecl, TsType};

use crate::{api_extractor::FileManager, ImportReference, ParsedModule, TypeExport};

pub struct TypeResolver<'a, R: FileManager> {
    pub files: &'a mut R,
    pub current_file: Rc<String>,
}

pub enum ResolvedType {
    TsType(Rc<TsType>),
    TsInterfaceDecl(Rc<TsInterfaceDecl>),
    Imported {
        exported: Rc<TypeExport>,
        from_file: Rc<ImportReference>,
    },
}

impl<'a, R: FileManager> TypeResolver<'a, R> {
    pub fn new(files: &'a mut R, current_file: &Rc<String>) -> TypeResolver<'a, R> {
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

    pub fn resolve_local_type(&mut self, i: &Ident) -> Option<ResolvedType> {
        let k = &(i.sym.clone(), i.span.ctxt);
        if let Some(alias) = self.get_current_file().locals.type_aliases.get(k) {
            return Some(ResolvedType::TsType(alias.clone()));
        }
        if let Some(intf) = self.get_current_file().locals.interfaces.get(k) {
            return Some(ResolvedType::TsInterfaceDecl(intf.clone()));
        }
        if let Some(imported) = self
            .get_current_file()
            .imports
            .get(&(i.sym.clone(), i.span.ctxt))
        {
            let file = self.files.get_or_fetch_file(&imported.file_name)?;
            let exported = file.type_exports.get(&i.sym)?;
            return Some(ResolvedType::Imported {
                exported: exported.clone(),
                from_file: imported.clone(),
            });
        }
        None
    }
}
