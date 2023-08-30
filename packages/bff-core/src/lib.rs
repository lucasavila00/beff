pub mod api_extractor;
pub mod coercer;
pub mod decoder;
pub mod diag;
pub mod emit;
pub mod open_api_ast;
pub mod parse;
pub mod printer;
pub mod swc_builder;
pub mod type_to_schema;
use std::{collections::HashMap, path::PathBuf, sync::Arc};

use crate::api_extractor::FnHandler;
use crate::diag::Diagnostic;
use crate::open_api_ast::Definition;
use open_api_ast::OpenApi;
use swc_atoms::JsWord;
use swc_common::{FileName, SourceFile, SyntaxContext};
use swc_ecma_ast::{Module, TsInterfaceDecl, TsType, TsTypeAliasDecl};
use swc_ecma_visit::Visit;
use swc_node_comments::SwcComments;
pub enum TypeExport {
    TsType(TsType),
    TsInterfaceDecl(TsInterfaceDecl),
}

#[derive(Debug)]
pub struct BffModuleData {
    pub fm: Arc<SourceFile>,
    pub module: Module,
}

#[derive(Debug)]
pub struct ImportReference {
    pub file_name: FileName,
}

pub struct ParsedModule {
    pub locals: ParsedModuleLocals,
    pub module: BffModuleData,
    pub imports: HashMap<(JsWord, SyntaxContext), ImportReference>,
    pub comments: SwcComments,
    pub type_exports: HashMap<JsWord, TypeExport>,
}

pub struct ParsedModuleLocals {
    pub type_aliases: HashMap<(JsWord, SyntaxContext), TsType>,
    pub interfaces: HashMap<(JsWord, SyntaxContext), TsInterfaceDecl>,
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
            .insert((id.sym.clone(), id.span.ctxt), *type_ann.clone());
    }
    fn visit_ts_interface_decl(&mut self, n: &TsInterfaceDecl) {
        let TsInterfaceDecl { id, .. } = n;
        self.interfaces
            .insert((id.sym.clone(), id.span.ctxt), n.clone());
    }
}

#[derive(Debug)]
pub struct BundleResult {
    pub entry_point: PathBuf,
    pub entry_file_name: FileName,
    pub errors: Vec<Diagnostic>,
    pub open_api: OpenApi,
    pub handlers: Vec<FnHandler>,
    pub components: Vec<Definition>,
}
