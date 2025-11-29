pub mod ast;
pub mod diag;
pub mod frontend;
pub mod import_resolver;
pub mod parse;
pub mod parser_extractor;
pub mod print;
pub mod subtyping;
pub mod sym_reference;
pub mod type_to_schema;
pub mod wasm_diag;

use crate::ast::runtype::Runtype;
use core::fmt;
use parser_extractor::extract_parser;
use parser_extractor::ParserExtractResult;
use serde::Deserialize;
use serde::Serialize;
use std::collections::BTreeSet;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::Arc;
use swc_atoms::JsWord;
use swc_common::SourceFile;
use swc_common::SourceMap;
use swc_common::Span;
use swc_common::SyntaxContext;
use swc_ecma_ast::Decl;
use swc_ecma_ast::Expr;
use swc_ecma_ast::ModuleItem;
use swc_ecma_ast::Pat;
use swc_ecma_ast::Stmt;
use swc_ecma_ast::TsEnumDecl;
use swc_ecma_ast::TsTypeParamDecl;
use swc_ecma_ast::{Module, TsType};
use swc_ecma_ast::{TsInterfaceDecl, TsTypeAliasDecl};
use swc_ecma_visit::Visit;
use swc_node_comments::SwcComments;

#[derive(Debug, Clone)]
pub enum SymbolExport {
    TsType {
        params: Option<Rc<TsTypeParamDecl>>,
        ty: Rc<TsType>,
        name: JsWord,
        span: Span,
        original_file: BffFileName,
    },
    TsInterfaceDecl {
        decl: Rc<TsInterfaceDecl>,
        span: Span,
        original_file: BffFileName,
    },
    TsEnumDecl {
        decl: Rc<TsEnumDecl>,
        span: Span,
        original_file: BffFileName,
    },
    ValueExpr {
        expr: Rc<Expr>,
        name: JsWord,
        span: Span,
        original_file: BffFileName,
    },
    ExprDecl {
        name: JsWord,
        span: Span,
        original_file: BffFileName,
        ty: Rc<TsType>,
    },
    StarOfOtherFile {
        reference: Rc<ImportReference>,
        span: Span,
    },
    SomethingOfOtherFile {
        something: String,
        file: BffFileName,
        span: Span,
    },
}

impl SymbolExport {
    pub fn span(&self) -> Span {
        match self {
            SymbolExport::TsType { span, .. }
            | SymbolExport::TsInterfaceDecl { span, .. }
            | SymbolExport::ValueExpr { span, .. }
            | SymbolExport::StarOfOtherFile { span, .. }
            | SymbolExport::SomethingOfOtherFile { span, .. }
            | SymbolExport::TsEnumDecl { span, .. }
            | SymbolExport::ExprDecl { span, .. } => *span,
        }
    }
}

pub struct BffModuleData {
    pub bff_fname: BffFileName,
    pub fm: Arc<SourceFile>,
    pub source_map: Arc<SourceMap>,
    pub module: Module,
}

#[derive(Debug, Clone, Eq, PartialEq, Hash, PartialOrd, Ord)]
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
        original_name: Rc<String>,
        file_name: BffFileName,
        span: Span,
    },
    Star {
        file_name: BffFileName,
        span: Span,
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
pub struct SymbolsExportsModule {
    named_types: HashMap<String, Rc<SymbolExport>>,
    named_values: HashMap<String, Rc<SymbolExport>>,

    named_unknown: HashMap<String, Rc<SymbolExport>>,

    extends: Vec<BffFileName>,
}
impl Default for SymbolsExportsModule {
    fn default() -> Self {
        Self::new()
    }
}
impl SymbolsExportsModule {
    pub fn new() -> SymbolsExportsModule {
        SymbolsExportsModule {
            named_types: HashMap::new(),
            named_values: HashMap::new(),
            named_unknown: HashMap::new(),
            extends: Vec::new(),
        }
    }
    pub fn insert_value(&mut self, name: String, export: Rc<SymbolExport>) {
        self.named_values.insert(name, export);
    }

    pub fn get_value<R: FileManager>(
        &self,
        name: &String,
        files: &mut R,
    ) -> Option<Rc<SymbolExport>> {
        let known = self.named_values.get(name).cloned().or_else(|| {
            for it in &self.extends {
                let file = files.get_or_fetch_file(it)?;
                let res = file.symbol_exports.get_value(name, files);
                if let Some(it) = res {
                    return Some(it.clone());
                }
            }
            None
        });

        known.or_else(|| self.named_unknown.get(name).cloned())
    }

    pub fn insert_type(&mut self, name: String, export: Rc<SymbolExport>) {
        self.named_types.insert(name, export);
    }

    pub fn insert_unknown(&mut self, name: String, export: Rc<SymbolExport>) {
        self.named_unknown.insert(name, export);
    }

    pub fn get_type<R: FileManager>(
        &self,
        name: &String,
        files: &mut R,
    ) -> Option<Rc<SymbolExport>> {
        let known = self.named_types.get(name).cloned().or_else(|| {
            for it in &self.extends {
                let file = files.get_or_fetch_file(it)?;
                let res = file.symbol_exports.get_type(name, files);
                if let Some(it) = res {
                    return Some(it.clone());
                }
            }
            None
        });

        known.or_else(|| self.named_unknown.get(name).cloned())
    }

    pub fn extend(&mut self, other: BffFileName) {
        self.extends.push(other);
    }
}

#[derive(Debug)]
pub struct SymbolExportDefault {
    pub symbol_export: Rc<Expr>,
    pub span: Span,
    pub file_name: BffFileName,
}

pub struct ParsedModule {
    pub locals: ParsedModuleLocals,
    pub module: BffModuleData,
    pub imports: HashMap<String, Rc<ImportReference>>,
    pub comments: SwcComments,
    pub symbol_exports: SymbolsExportsModule,
    pub export_default: Option<Rc<SymbolExportDefault>>,
}

type TypeAliasMap = HashMap<String, (Option<Rc<TsTypeParamDecl>>, Rc<TsType>)>;

#[derive(Debug)]
pub struct ParsedModuleLocals {
    pub type_aliases: TypeAliasMap,
    pub interfaces: HashMap<String, Rc<TsInterfaceDecl>>,
    pub enums: HashMap<String, Rc<TsEnumDecl>>,

    pub exprs: HashMap<String, Rc<Expr>>,
    pub exprs_decls: HashMap<String, Rc<TsType>>,
}
impl ParsedModuleLocals {
    pub fn new() -> ParsedModuleLocals {
        ParsedModuleLocals {
            type_aliases: HashMap::new(),
            interfaces: HashMap::new(),
            enums: HashMap::new(),
            exprs: HashMap::new(),
            exprs_decls: HashMap::new(),
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
impl Default for ParserOfModuleLocals {
    fn default() -> Self {
        Self::new()
    }
}
impl ParserOfModuleLocals {
    pub fn new() -> ParserOfModuleLocals {
        ParserOfModuleLocals {
            content: ParsedModuleLocals::new(),
        }
    }

    pub fn visit_module_item_list(&mut self, it: &[ModuleItem]) {
        for it in it {
            match it {
                ModuleItem::Stmt(Stmt::Decl(decl)) => {
                    // add expr to self.content
                    if let Decl::Var(var_decl) = decl {
                        for it in &var_decl.decls {
                            if let Some(expr) = &it.init {
                                if let Pat::Ident(id) = &it.name {
                                    self.content
                                        .exprs
                                        .insert(id.sym.to_string(), Rc::new(*expr.clone()));
                                }
                            }

                            if var_decl.declare {
                                if let Pat::Ident(id) = &it.name {
                                    if let Some(ann) = &id.type_ann {
                                        self.content.exprs_decls.insert(
                                            id.sym.to_string(),
                                            Rc::new(*ann.type_ann.clone()),
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
                ModuleItem::ModuleDecl(_) => {}
                ModuleItem::Stmt(_) => {}
            }
        }
    }
}

impl Visit for ParserOfModuleLocals {
    fn visit_ts_type_alias_decl(&mut self, n: &TsTypeAliasDecl) {
        let TsTypeAliasDecl {
            id,
            type_ann,
            type_params,
            ..
        } = n;
        self.content.type_aliases.insert(
            id.sym.to_string(),
            (
                type_params.as_ref().map(|it| it.as_ref().clone().into()),
                Rc::new(*type_ann.clone()),
            ),
        );
    }
    fn visit_ts_interface_decl(&mut self, n: &TsInterfaceDecl) {
        let TsInterfaceDecl { id, .. } = n;
        self.content
            .interfaces
            .insert(id.sym.to_string(), Rc::new(n.clone()));
    }

    fn visit_ts_enum_decl(&mut self, n: &swc_ecma_ast::TsEnumDecl) {
        let TsEnumDecl { id, .. } = n;
        self.content
            .enums
            .insert(id.sym.to_string(), Rc::new(n.clone()));
    }
}

pub struct UnresolvedExport {
    pub name: JsWord,
    pub span: SyntaxContext,
    pub renamed: JsWord,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum FrontendVersion {
    #[serde(rename = "v1")]
    V1,
    #[serde(rename = "v2")]
    V2,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BeffUserSettings {
    pub string_formats: BTreeSet<String>,
    pub number_formats: BTreeSet<String>,
    pub frontend: FrontendVersion,
}

pub struct EntryPoints {
    pub parser_entry_point: BffFileName,
    pub settings: BeffUserSettings,
}
pub trait FileManager {
    fn get_or_fetch_file(&mut self, name: &BffFileName) -> Option<Rc<ParsedModule>>;
    fn get_existing_file(&self, name: &BffFileName) -> Option<Rc<ParsedModule>>;
}

fn debug_print_type_list(vs: Vec<(RuntypeName, String)>) -> String {
    let mut acc = String::new();
    for (name, ts_type) in vs {
        acc.push_str(&format!("type {} = {};\n\n", name.debug_print(), ts_type));
    }
    acc
}

fn debug_print_type_object(vs: Vec<(String, String)>) -> String {
    let mut acc = String::new();
    acc.push_str("{\n");
    for (name, ts_type) in vs {
        acc.push_str(&format!("  {}: {},\n", name, ts_type));
    }
    acc.push_str("}\n");
    acc
}

impl ParserExtractResult {
    pub fn debug_print(&self) -> String {
        let mut vs: Vec<(RuntypeName, String)> = vec![];

        let mut sorted_validators = self.validators.iter().collect::<Vec<_>>();
        sorted_validators.sort_by(|a, b| a.name.cmp(&b.name));

        for v in sorted_validators {
            vs.push((v.name.clone(), v.schema.debug_print()));
        }

        let validators_printed = debug_print_type_list(vs.clone());

        let mut decoders_vs: Vec<(String, String)> = vec![];
        let empty = vec![];
        let mut sorted_decoders = self
            .built_decoders
            .as_ref()
            .unwrap_or(&empty)
            .iter()
            .collect::<Vec<_>>();
        sorted_decoders.sort_by(|a, b| a.exported_name.cmp(&b.exported_name));

        for v in sorted_decoders {
            decoders_vs.push((v.exported_name.clone(), v.schema.debug_print()));
        }

        let decoders_printed = format!(
            "type BuiltParsers = {}",
            debug_print_type_object(decoders_vs.clone())
        );

        [validators_printed, decoders_printed]
            .into_iter()
            .filter(|it| !it.is_empty())
            .collect::<Vec<String>>()
            .join("\n")
            .trim()
            .to_string()
    }
}
pub fn extract<R: FileManager>(files: &mut R, entry_points: EntryPoints) -> ParserExtractResult {
    extract_parser(
        files,
        entry_points.parser_entry_point,
        &entry_points.settings,
    )
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord, Copy)]
pub enum Visibility {
    Local,
    Export,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct ModuleItemAddress {
    pub file: BffFileName,
    pub key: String,
    pub visibility: Visibility,
}

impl ModuleItemAddress {
    pub fn from_ident(
        ident: &swc_ecma_ast::Ident,
        file: BffFileName,
        visibility: Visibility,
    ) -> ModuleItemAddress {
        ModuleItemAddress {
            file,
            key: ident.sym.to_string(),
            visibility,
        }
    }

    fn debug_print(&self) -> String {
        format!("{}::{}", self.file.as_str(), self.key,)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum RuntypeName {
    Name(String),
    Address(ModuleItemAddress),
    SemtypeRecursiveGenerated(usize),
}

impl RuntypeName {
    fn debug_print(&self) -> String {
        match self {
            RuntypeName::Name(name) => name.clone(),
            RuntypeName::Address(addr) => addr.debug_print(),
            RuntypeName::SemtypeRecursiveGenerated(n) => format!("RecursiveGenerated{}", n),
        }
    }
}

#[derive(Debug, Clone)]
pub struct NamedSchema {
    pub name: RuntypeName,
    pub schema: Runtype,
}
