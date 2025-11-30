pub mod ast;
pub mod diag;
pub mod frontend;
pub mod parser_extractor;
pub mod print;
pub mod subtyping;
pub mod swc_tools;
pub mod test_tools;
pub mod wasm_diag;

use crate::ast::runtype::DebugPrintCtx;
use crate::ast::runtype::Runtype;
use crate::swc_tools::ImportReference;
use crate::swc_tools::SymbolsExportsModule;
use crate::swc_tools::bind_locals::ParsedModuleLocals;
use core::fmt;
use parser_extractor::ParserExtractResult;
use parser_extractor::extract_parser;
use serde::Deserialize;
use serde::Serialize;
use std::collections::BTreeMap;
use std::collections::BTreeSet;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::Arc;
use swc_atoms::JsWord;
use swc_common::SourceFile;
use swc_common::SourceMap;
use swc_common::SyntaxContext;
use swc_ecma_ast::Module;
use swc_node_comments::SwcComments;

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

pub struct ParsedModule {
    pub locals: ParsedModuleLocals,
    pub module: BffModuleData,
    pub imports: HashMap<String, Rc<ImportReference>>,
    pub comments: SwcComments,
    pub symbol_exports: SymbolsExportsModule,
}

#[derive(Debug)]
pub struct UnresolvedExport {
    pub name: JsWord,
    pub span: SyntaxContext,
    pub renamed: JsWord,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BeffUserSettings {
    pub string_formats: BTreeSet<String>,
    pub number_formats: BTreeSet<String>,
}

pub struct EntryPoints {
    pub parser_entry_point: BffFileName,
    pub settings: BeffUserSettings,
}
pub trait FileManager {
    fn get_or_fetch_file(&mut self, name: &BffFileName) -> Option<Rc<ParsedModule>>;
    fn get_existing_file(&self, name: &BffFileName) -> Option<Rc<ParsedModule>>;

    fn resolve_import(
        &mut self,
        current_file: BffFileName,
        module_specifier: &str,
    ) -> Option<BffFileName>;
}

fn debug_print_type_list(vs: Vec<(RuntypeUUID, String)>) -> String {
    let mut acc = String::new();
    let all_names = vs.iter().map(|(name, _)| name).collect::<Vec<_>>();
    let mut recursive_generic_count = BTreeMap::new();
    let mut ctx = DebugPrintCtx {
        all_names: &all_names,
        recursive_generic_count_map: &mut recursive_generic_count,
    };

    for (name, ts_type) in vs.iter() {
        acc.push_str(&format!(
            "type {} = {};\n\n",
            name.debug_print(&mut ctx),
            ts_type
        ));
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
        let mut vs: Vec<(RuntypeUUID, String)> = vec![];

        let mut sorted_validators = self.validators.iter().collect::<Vec<_>>();
        sorted_validators.sort_by(|a, b| a.name.cmp(&b.name));

        let all_names = sorted_validators
            .iter()
            .map(|it| &it.name)
            .collect::<Vec<_>>();
        let mut recursive_generic_count = BTreeMap::new();
        let mut debug_print_ctx = DebugPrintCtx {
            all_names: &all_names,
            recursive_generic_count_map: &mut recursive_generic_count,
        };

        for v in sorted_validators {
            vs.push((v.name.clone(), v.schema.debug_print(&mut debug_print_ctx)));
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
            decoders_vs.push((
                v.exported_name.clone(),
                v.schema.debug_print(&mut debug_print_ctx),
            ));
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
    pub name: String,
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
            name: ident.sym.to_string(),
            visibility,
        }
    }

    fn min_file_path_that_differs(this: &BffFileName, others: &[BffFileName]) -> String {
        let this_parts: Vec<&str> = this.as_str().split('/').collect();
        let others_parts: Vec<Vec<&str>> = others
            .iter()
            .map(|it| it.as_str().split('/').collect())
            .collect();

        let mut min_index = this_parts.len();
        for other_parts in &others_parts {
            let mut index = 0;
            while index < this_parts.len()
                && index < other_parts.len()
                && this_parts[index] == other_parts[index]
            {
                index += 1;
            }
            if index < min_index {
                min_index = index;
            }
        }

        this_parts[min_index..].join("/")
    }

    fn valid_ts_identifier_from_path(p: &str) -> String {
        let mut acc = String::new();
        for c in p.chars() {
            if c.is_ascii_alphanumeric() || c == '_' {
                acc.push(c);
            } else {
                acc.push('_');
            }
        }
        acc
    }

    fn ts_identifier(&self, all_names: &[&RuntypeUUID]) -> String {
        let mut has_same_name = vec![];
        for name in all_names {
            match &name.ty {
                RuntypeName::EnumItem {
                    address: module_item_address,
                    ..
                }
                | RuntypeName::Address(module_item_address) => {
                    if module_item_address == self {
                        continue;
                    }
                    if module_item_address.name == self.name {
                        has_same_name.push(module_item_address.file.clone());
                    }
                }
                RuntypeName::SemtypeRecursiveGenerated(_) => {}
            }
        }

        if has_same_name.is_empty() {
            // no conflict, just print name
            return self.name.clone();
        }

        // should be a valid typescript identifier
        format!(
            "{}__{}__{}",
            Self::valid_ts_identifier_from_path(&Self::min_file_path_that_differs(
                &self.file,
                &has_same_name
            )),
            self.name,
            match self.visibility {
                Visibility::Local => "local",
                Visibility::Export => "export",
            }
        )
    }

    fn diag_print(&self) -> String {
        // printing for error messages
        format!("{}::{}", self.file.as_str(), self.name,)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum RuntypeName {
    Address(ModuleItemAddress),
    EnumItem {
        address: ModuleItemAddress,
        member_name: String,
    },
    SemtypeRecursiveGenerated(usize),
}

impl RuntypeName {
    fn print_name_for_js_codegen(&self, all_names: &[&RuntypeUUID]) -> String {
        match self {
            RuntypeName::Address(addr) => addr.ts_identifier(all_names),
            RuntypeName::SemtypeRecursiveGenerated(n) => format!("RecursiveGenerated{}", n),
            RuntypeName::EnumItem {
                address: enum_type,
                member_name,
            } => {
                format!("{}__{}", enum_type.ts_identifier(all_names), member_name)
            }
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct RuntypeUUID {
    pub ty: RuntypeName,
    pub type_arguments: Vec<Runtype>,
}

impl RuntypeUUID {
    fn debug_print(&self, ctx: &mut DebugPrintCtx) -> String {
        let mut acc = String::new();
        acc.push_str(&self.ty.print_name_for_js_codegen(ctx.all_names));
        if !self.type_arguments.is_empty() {
            let rest = format!(
                "<{}>",
                self.type_arguments
                    .iter()
                    .map(|it| it.debug_print(ctx))
                    .collect::<Vec<_>>()
                    .join(", ")
            );
            acc.push_str(&rest);
        }
        acc
    }
    fn diag_print(&self) -> String {
        let mut recursive_generic_count = BTreeMap::new();
        let mut empty_ctx = DebugPrintCtx {
            all_names: &[],
            recursive_generic_count_map: &mut recursive_generic_count,
        };
        self.debug_print(&mut empty_ctx)
    }

    fn tap_str(it: usize) -> String {
        format!("_type_application_instance_{}", it)
    }

    fn print_name_for_js_codegen(&self, ctx: &mut DebugPrintCtx<'_>) -> String {
        let mut acc = String::new();
        acc.push_str(&self.ty.print_name_for_js_codegen(ctx.all_names));
        if !self.type_arguments.is_empty() {
            let tap_counter = match ctx.recursive_generic_count_map.get(self) {
                Some(count) => Self::tap_str(*count),
                None => {
                    let recursive_generic_count = ctx.recursive_generic_count_map.len();
                    let it = Self::tap_str(recursive_generic_count);
                    ctx.recursive_generic_count_map
                        .insert(self.clone(), recursive_generic_count);
                    it
                }
            };
            acc.push_str(&tap_counter);
        }
        acc
    }
}

#[derive(Debug, Clone)]
pub struct NamedSchema {
    pub name: RuntypeUUID,
    pub schema: Runtype,
}
