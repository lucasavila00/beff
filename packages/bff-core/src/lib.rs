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
use std::{collections::HashMap, rc::Rc, sync::Arc};
use swc_atoms::JsWord;
use swc_common::{SourceFile, SourceMap, SyntaxContext};
use swc_ecma_ast::{Module, TsInterfaceDecl, TsType, TsTypeAliasDecl};
use swc_ecma_visit::Visit;
use swc_node_comments::SwcComments;
#[derive(Debug, Clone)]
pub enum TypeExport {
    TsType(Rc<TsType>),
    TsInterfaceDecl(Rc<TsInterfaceDecl>),
    StarOfOtherFile(Rc<ImportReference>),
    SomethingOfOtherFile(JsWord, Rc<String>),
}

pub struct BffModuleData {
    pub fm: Arc<SourceFile>,
    pub source_map: Arc<SourceMap>,
    pub module: Module,
}

#[derive(Debug, Clone)]
pub enum ImportReferenceType {
    Named,
    Star,
    Default,
}

#[derive(Debug, Clone)]
pub struct ImportReference {
    pub file_name: Rc<String>,
    pub import_type: ImportReferenceType,
}

pub struct ParsedModule {
    pub locals: ParsedModuleLocals,
    pub module: BffModuleData,
    pub imports: HashMap<(JsWord, SyntaxContext), Rc<ImportReference>>,
    pub comments: SwcComments,
    pub type_exports: HashMap<JsWord, Rc<TypeExport>>,
}

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
impl Visit for ParsedModuleLocals {
    fn visit_ts_type_alias_decl(&mut self, n: &TsTypeAliasDecl) {
        let TsTypeAliasDecl { id, type_ann, .. } = n;
        self.type_aliases
            .insert((id.sym.clone(), id.span.ctxt), Rc::new(*type_ann.clone()));
    }
    fn visit_ts_interface_decl(&mut self, n: &TsInterfaceDecl) {
        let TsInterfaceDecl { id, .. } = n;
        self.interfaces
            .insert((id.sym.clone(), id.span.ctxt), Rc::new(n.clone()));
    }
}
