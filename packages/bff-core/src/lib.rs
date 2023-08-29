pub mod diag;
pub mod open_api_ast;
pub mod swc_builder;

use std::{collections::HashMap, rc::Rc};

use swc_atoms::JsWord;
use swc_common::{FileName, SourceFile, SyntaxContext};
use swc_ecma_ast::{Module, TsInterfaceDecl, TsType};
use swc_node_comments::SwcComments;

pub enum TypeExport {
    TsType(TsType),
    TsInterfaceDecl(TsInterfaceDecl),
}

pub struct BffModuleData {
    pub fm: Rc<SourceFile>,
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
