pub mod api_extractor;
pub mod ast;
pub mod diag;
pub mod emit;
pub mod import_resolver;
pub mod open_api_ast;
pub mod parse;
pub mod parser_extractor;
pub mod print;
pub mod subtyping;
pub mod swc_builder;
pub mod type_reference;
pub mod type_to_schema;
use api_extractor::extract_schema;
use api_extractor::RouterExtractResult;
use core::fmt;
use diag::Diagnostic;
use open_api_ast::Validator;
use parser_extractor::extract_parser;
use parser_extractor::ParserExtractResult;
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
pub struct EntryPoints {
    pub router_entry_point: Option<BffFileName>,
    pub parser_entry_point: Option<BffFileName>,
}
pub trait FileManager {
    fn get_or_fetch_file(&mut self, name: &BffFileName) -> Option<Rc<ParsedModule>>;
    fn get_existing_file(&self, name: &BffFileName) -> Option<Rc<ParsedModule>>;
}

pub struct ExtractResult {
    pub router: Option<RouterExtractResult>,
    pub parser: Option<ParserExtractResult>,
}

impl ExtractResult {
    pub fn is_empty(&self) -> bool {
        self.router.is_none() && self.parser.is_none()
    }
    pub fn errors(&self) -> Vec<&Diagnostic> {
        self.router
            .as_ref()
            .map(|it| it.errors.iter().map(|it| it).collect())
            .unwrap_or(vec![])
            .into_iter()
            .chain(
                self.parser
                    .as_ref()
                    .map(|it| it.errors.iter().map(|it| it).collect())
                    .unwrap_or(vec![]),
            )
            .collect()
    }
    pub fn validators(&self) -> Vec<&Validator> {
        self.router
            .as_ref()
            .map(|it| it.validators.iter().map(|it| it).collect())
            .unwrap_or(vec![])
            .into_iter()
            .chain(
                self.parser
                    .as_ref()
                    .map(|it| it.validators.iter().map(|it| it).collect())
                    .unwrap_or(vec![]),
            )
            .collect()
    }

    pub fn self_check_sem_types(&self) {
        let definitions = self.validators();
        for def in &definitions {
            let res = def.schema.is_sub_type(&def.schema, &definitions).unwrap();
            assert!(res);
        }
    }
}

pub fn extract<R: FileManager>(files: &mut R, entry: EntryPoints) -> ExtractResult {
    let mut router = None;
    let mut parser = None;

    if let Some(entry) = entry.router_entry_point {
        router = Some(extract_schema(files, entry));
    }
    if let Some(entry) = entry.parser_entry_point {
        parser = Some(extract_parser(files, entry));
    }

    ExtractResult { router, parser }
}
