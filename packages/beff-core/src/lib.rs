pub mod api_extractor;
pub mod diag;
pub mod emit;
pub mod import_resolver;
pub mod open_api_ast;
pub mod parse;
pub mod print;
pub mod swc_builder;
pub mod type_resolve;
pub mod type_to_schema;
use api_extractor::FileManager;
use core::fmt;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::Arc;
use swc_atoms::JsWord;
use swc_common::SourceFile;
use swc_common::SourceMap;
use swc_common::SyntaxContext;
use swc_ecma_ast::{Module, TsType};
use swc_ecma_ast::{TsInterfaceDecl, TsTypeAliasDecl};
use swc_ecma_visit::Visit;
use swc_node_comments::SwcComments;

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

impl fmt::Display for BffFileName {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}
impl BffFileName {
    pub fn new(s: String) -> BffFileName {
        BffFileName(Rc::new(s))
    }
    pub fn as_str(&self) -> &str {
        self.0.as_str()
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
impl Default for TypeExportsModule {
    fn default() -> Self {
        Self::new()
    }
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

impl Default for ParsedModuleLocals {
    fn default() -> Self {
        Self::new()
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
