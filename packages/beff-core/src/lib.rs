pub mod api_extractor;
pub mod coercer;
pub mod decoder;
pub mod diag;
pub mod emit;
pub mod open_api_ast;
pub mod parse;
pub mod printer;
pub mod swc_builder;
pub mod type_resolve;
pub mod type_to_schema;
use anyhow::anyhow;
use anyhow::Result;
use api_extractor::FileManager;
use std::collections::HashMap;
use std::collections::HashSet;
use std::rc::Rc;
use std::sync::Arc;
use swc_atoms::JsWord;
use swc_common::SourceFile;
use swc_common::SourceMap;
use swc_common::{FileName, SyntaxContext};
use swc_ecma_ast::Decl;
use swc_ecma_ast::ExportAll;
use swc_ecma_ast::ExportDecl;
use swc_ecma_ast::ExportNamedSpecifier;
use swc_ecma_ast::ExportNamespaceSpecifier;
use swc_ecma_ast::ExportSpecifier;
use swc_ecma_ast::Ident;
use swc_ecma_ast::ImportDefaultSpecifier;
use swc_ecma_ast::ImportStarAsSpecifier;
use swc_ecma_ast::ModuleExportName;
use swc_ecma_ast::NamedExport;
use swc_ecma_ast::{
    ImportDecl, ImportNamedSpecifier, ImportSpecifier, TsInterfaceDecl, TsTypeAliasDecl,
};
use swc_ecma_ast::{Module, TsType};
use swc_ecma_visit::Visit;
use swc_node_comments::SwcComments;

use crate::parse::load_source_file;

#[derive(Debug, Clone)]
pub enum TypeExport {
    TsType { ty: Rc<TsType>, name: JsWord },
    TsInterfaceDecl(Rc<TsInterfaceDecl>),
    StarOfOtherFile(Rc<ImportReference>),
    SomethingOfOtherFile(JsWord, BffFileName),
}

pub struct BffModuleData {
    pub fm: Arc<SourceFile>,
    pub source_map: Arc<SourceMap>,
    pub module: Module,
}

#[derive(Debug, Clone, Eq, PartialEq, Hash)]
pub struct BffFileName(Rc<String>);

impl BffFileName {
    pub fn new(s: String) -> BffFileName {
        BffFileName(Rc::new(s))
    }
    pub fn as_str(&self) -> &str {
        self.0.as_str()
    }
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }
}

#[derive(Debug, Clone)]
pub enum ImportReference {
    Named {
        orig: Rc<JsWord>,
        file_name: BffFileName,
    },
    Star {
        file_name: BffFileName,
    },
    Default {
        file_name: BffFileName,
    },
}

impl ImportReference {
    pub fn file_name(&self) -> &BffFileName {
        match self {
            ImportReference::Named { file_name, .. } => file_name,
            ImportReference::Star { file_name, .. } => file_name,
            ImportReference::Default { file_name, .. } => file_name,
        }
    }
}
#[derive(Debug, Clone)]
pub struct TypeExportsModule {
    named: HashMap<JsWord, Rc<TypeExport>>,
    extends: Vec<BffFileName>,
}
impl TypeExportsModule {
    pub fn new() -> TypeExportsModule {
        TypeExportsModule {
            named: HashMap::new(),
            extends: Vec::new(),
        }
    }
    pub fn insert(&mut self, name: JsWord, export: Rc<TypeExport>) {
        self.named.insert(name, export);
    }

    pub fn get<R: FileManager>(&self, name: &JsWord, files: &mut R) -> Option<Rc<TypeExport>> {
        self.named.get(name).cloned().or_else(|| {
            for it in &self.extends {
                let file = files.get_or_fetch_file(it)?;
                let res = file.type_exports.get(name, files);
                if let Some(it) = res {
                    return Some(it.clone());
                }
            }
            None
        })
    }

    pub fn extend(&mut self, other: BffFileName) {
        self.extends.push(other);
    }
}

pub struct ParsedModule {
    pub locals: ParsedModuleLocals,
    pub module: BffModuleData,
    pub imports: HashMap<(JsWord, SyntaxContext), Rc<ImportReference>>,
    pub comments: SwcComments,
    pub type_exports: TypeExportsModule,
}

#[derive(Debug)]
pub struct ParsedModuleLocals {
    pub type_aliases: HashMap<(JsWord, SyntaxContext), Rc<TsType>>,
    pub interfaces: HashMap<(JsWord, SyntaxContext), Rc<TsInterfaceDecl>>,
}
impl ParsedModuleLocals {
    pub fn new() -> ParsedModuleLocals {
        ParsedModuleLocals {
            type_aliases: HashMap::new(),
            interfaces: HashMap::new(),
        }
    }
}

pub struct ParserOfModuleLocals {
    content: ParsedModuleLocals,
}

impl Visit for ParserOfModuleLocals {
    fn visit_ts_type_alias_decl(&mut self, n: &TsTypeAliasDecl) {
        let TsTypeAliasDecl { id, type_ann, .. } = n;
        self.content
            .type_aliases
            .insert((id.sym.clone(), id.span.ctxt), Rc::new(*type_ann.clone()));
    }
    fn visit_ts_interface_decl(&mut self, n: &TsInterfaceDecl) {
        let TsInterfaceDecl { id, .. } = n;
        self.content
            .interfaces
            .insert((id.sym.clone(), id.span.ctxt), Rc::new(n.clone()));
    }
}

pub struct UnresolvedExport {
    pub name: JsWord,
    pub span: SyntaxContext,
    pub renamed: JsWord,
}

pub trait ImportResolver {
    fn resolve_import(&mut self, module_specifier: &str) -> Option<BffFileName>;
}
pub struct ImportsVisitor<'a, R: ImportResolver> {
    pub resolver: &'a mut R,
    pub imports: HashMap<(JsWord, SyntaxContext), Rc<ImportReference>>,
    pub type_exports: TypeExportsModule,
    pub current_file: BffFileName,
    pub unresolved_exports: Vec<UnresolvedExport>,
}
impl<'a, R: ImportResolver> ImportsVisitor<'a, R> {
    pub fn from_file(current_file: BffFileName, resolver: &'a mut R) -> ImportsVisitor<'a, R> {
        ImportsVisitor {
            imports: HashMap::new(),
            type_exports: TypeExportsModule::new(),
            current_file,
            unresolved_exports: Vec::new(),
            resolver,
        }
    }
    fn resolve_import(&mut self, module_specifier: &str) -> Option<BffFileName> {
        self.resolver.resolve_import(module_specifier)
    }

    fn insert_import_named(&mut self, local: &Ident, module_specifier: &str, orig: &JsWord) {
        let k = (local.sym.clone(), local.span.ctxt);
        let v = self.resolve_import(&module_specifier);

        if let Some(v) = v {
            self.imports.insert(
                k,
                Rc::new(ImportReference::Named {
                    orig: Rc::new(orig.clone()),
                    file_name: v,
                }),
            );
        }
    }
    fn insert_import_default(&mut self, local: &Ident, module_specifier: &str) {
        let k = (local.sym.clone(), local.span.ctxt);
        let v = self.resolve_import(&module_specifier);

        if let Some(v) = v {
            self.imports
                .insert(k, Rc::new(ImportReference::Default { file_name: v }));
        }
    }
    fn insert_import_star(&mut self, local: &Ident, module_specifier: &str) {
        let k = (local.sym.clone(), local.span.ctxt);
        let v = self.resolve_import(&module_specifier);

        if let Some(v) = v {
            self.imports
                .insert(k, Rc::new(ImportReference::Star { file_name: v }));
        }
    }
}

impl<'a, R: ImportResolver> Visit for ImportsVisitor<'a, R> {
    fn visit_export_decl(&mut self, n: &ExportDecl) {
        match &n.decl {
            Decl::TsInterface(n) => {
                let TsInterfaceDecl { id, .. } = &**n;
                self.type_exports.insert(
                    id.sym.clone(),
                    Rc::new(TypeExport::TsInterfaceDecl(Rc::new(*n.clone()))),
                );
            }
            Decl::TsTypeAlias(a) => {
                let TsTypeAliasDecl { id, type_ann, .. } = &**a;
                self.type_exports.insert(
                    id.sym.clone(),
                    Rc::new(TypeExport::TsType {
                        ty: Rc::new(*type_ann.clone()),
                        name: id.sym.clone(),
                    }),
                );
            }
            Decl::TsModule(_)
            | Decl::Using(_)
            | Decl::Class(_)
            | Decl::Fn(_)
            | Decl::TsEnum(_)
            | Decl::Var(_) => {}
        }
    }

    fn visit_named_export(&mut self, n: &NamedExport) {
        match &n.src {
            Some(src) => {
                //
                for s in &n.specifiers {
                    match s {
                        ExportSpecifier::Default(_) => {}
                        ExportSpecifier::Namespace(ExportNamespaceSpecifier { name, .. }) => {
                            if let ModuleExportName::Ident(id) = name {
                                if let Some(file_name) = self.resolve_import(&src.value) {
                                    self.type_exports.insert(
                                        id.sym.clone(),
                                        Rc::new(TypeExport::StarOfOtherFile(
                                            ImportReference::Star {
                                                file_name: file_name.clone(),
                                            }
                                            .into(),
                                        )),
                                    )
                                }
                            }
                        }
                        ExportSpecifier::Named(ExportNamedSpecifier { orig, exported, .. }) => {
                            if let ModuleExportName::Ident(id) = orig {
                                let name = match exported {
                                    Some(ModuleExportName::Ident(ex)) => ex.sym.clone(),
                                    Some(ModuleExportName::Str(st)) => st.value.clone(),
                                    None => id.sym.clone(),
                                };
                                if let Some(file_name) = self.resolve_import(&src.value) {
                                    self.type_exports.insert(
                                        name,
                                        Rc::new(TypeExport::SomethingOfOtherFile(
                                            id.sym.clone(),
                                            file_name.clone(),
                                        )),
                                    )
                                }
                            }
                        }
                    }
                }
            }
            None => {
                for s in &n.specifiers {
                    match s {
                        ExportSpecifier::Default(_) => {}
                        ExportSpecifier::Namespace(_) => {
                            unreachable!("cannot be namespace without source")
                        }
                        ExportSpecifier::Named(ExportNamedSpecifier { orig, exported, .. }) => {
                            if let ModuleExportName::Ident(id) = orig {
                                let renamed = match exported {
                                    Some(ModuleExportName::Ident(ex)) => ex.sym.clone(),
                                    Some(ModuleExportName::Str(st)) => st.value.clone(),
                                    None => id.sym.clone(),
                                };
                                self.unresolved_exports.push(UnresolvedExport {
                                    name: id.sym.clone(),
                                    span: id.span.ctxt,
                                    renamed,
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    fn visit_export_all(&mut self, n: &ExportAll) {
        if let Some(file_name) = self.resolve_import(&n.src.value) {
            self.type_exports.extend(file_name);
        }
    }
    fn visit_import_decl(&mut self, node: &ImportDecl) {
        let module_specifier = node.src.value.to_string();

        for x in &node.specifiers {
            match x {
                ImportSpecifier::Named(ImportNamedSpecifier {
                    local, imported, ..
                }) => match imported {
                    Some(imported) => match imported {
                        ModuleExportName::Ident(renamed) => {
                            self.insert_import_named(local, &module_specifier, &renamed.sym)
                        }
                        ModuleExportName::Str(_) => {}
                    },
                    None => self.insert_import_named(local, &module_specifier, &local.sym),
                },
                ImportSpecifier::Namespace(ImportStarAsSpecifier { local, .. }) => {
                    self.insert_import_star(local, &module_specifier)
                }
                ImportSpecifier::Default(ImportDefaultSpecifier { local, .. }) => {
                    self.insert_import_default(local, &module_specifier)
                }
            }
        }
    }
}

pub fn parse_file_content<R: ImportResolver>(
    resolver: &mut R,
    file_name: &BffFileName,
    content: &str,
) -> Result<(Rc<ParsedModule>, HashSet<BffFileName>)> {
    log::debug!("RUST: Parsing file {file_name:?}");
    let cm: SourceMap = SourceMap::default();
    let source_file = cm.new_source_file(
        FileName::Real(file_name.to_string().into()),
        content.to_owned(),
    );
    let (module, comments) = load_source_file(&source_file, &Arc::new(cm))?;
    let mut v = ImportsVisitor::from_file(BffFileName::new(module.fm.name.to_string()), resolver);
    v.visit_module(&module.module);

    let imports: HashSet<BffFileName> = v
        .imports
        .values()
        .into_iter()
        .map(|x| x.file_name().clone())
        .collect();

    let mut locals = ParserOfModuleLocals {
        content: ParsedModuleLocals::new(),
    };
    locals.visit_module(&module.module);

    let mut type_exports = v.type_exports;
    for unresolved in v.unresolved_exports {
        let renamed = unresolved.renamed;
        let k = (unresolved.name.clone(), unresolved.span);
        if let Some(alias) = locals.content.type_aliases.get(&k) {
            type_exports.insert(
                renamed.clone(),
                Rc::new(TypeExport::TsType {
                    ty: alias.clone(),
                    name: k.0,
                }),
            );
            continue;
        }
        if let Some(intf) = locals.content.interfaces.get(&k) {
            type_exports.insert(renamed, Rc::new(TypeExport::TsInterfaceDecl(intf.clone())));
            continue;
        }
        if let Some(import) = v.imports.get(&k) {
            match &**import {
                ImportReference::Named { orig, file_name } => {
                    let it = Rc::new(TypeExport::SomethingOfOtherFile(
                        orig.as_ref().clone(),
                        file_name.clone(),
                    ));
                    type_exports.insert(renamed, it);
                    continue;
                }
                ImportReference::Star { .. } => {
                    type_exports.insert(
                        renamed,
                        Rc::new(TypeExport::StarOfOtherFile(import.clone())),
                    );

                    continue;
                }
                ImportReference::Default { .. } => {
                    continue;
                }
            }
        }

        return Err(anyhow!(
            "Could not resolve export {name:?} in file {file_name:?}",
            name = &unresolved.name,
            file_name = file_name
        ));
    }

    let f = Rc::new(ParsedModule {
        module,
        type_exports,
        imports: v.imports,
        comments,
        locals: locals.content,
    });
    return Ok((f, imports));
}
