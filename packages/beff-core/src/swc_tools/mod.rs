use std::{collections::HashMap, rc::Rc};

use swc_atoms::JsWord;
use swc_common::Span;
use swc_ecma_ast::{Expr, TsEnumDecl, TsInterfaceDecl, TsType, TsTypeAliasDecl};

use crate::{Anchor, BffFileName, FileManager};

pub mod bind_exports;
pub mod bind_locals;
pub mod parse;

#[derive(Debug, Clone)]
pub enum SymbolExport {
    TsType {
        decl: Rc<TsTypeAliasDecl>,
        original_file: BffFileName,
        name: String,
    },
    TsInterfaceDecl {
        decl: Rc<TsInterfaceDecl>,
        original_file: BffFileName,
    },
    TsEnumDecl {
        decl: Rc<TsEnumDecl>,
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
    },
    SomethingOfOtherFile {
        something: String,
        file: BffFileName,
    },
}

#[derive(Debug, Clone)]
pub enum ImportReference {
    Named {
        original_name: Rc<String>,
        anchor: Anchor,
    },
    Star {
        anchor: Anchor,
    },
    Default {
        file_name: BffFileName,
    },
}

impl ImportReference {
    pub fn file_name(&self) -> &BffFileName {
        match self {
            ImportReference::Named { anchor, .. } => &anchor.f,
            ImportReference::Star { anchor, .. } => &anchor.f,
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

    pub export_default: Option<Rc<SymbolExportDefault>>,
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
            export_default: None,
        }
    }
    pub fn set_default_export(&mut self, export: Rc<SymbolExportDefault>) {
        if self.export_default.is_some() {
            panic!("Default export already set");
        }
        self.export_default = Some(export);
    }

    pub fn insert_value(&mut self, name: String, export: Rc<SymbolExport>) {
        if name == "default" {
            self.set_default_export(SymbolExportDefault::Renamed { export }.into());
            return;
        }
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
        if name == "default" {
            self.set_default_export(SymbolExportDefault::Renamed { export }.into());
            return;
        }
        self.named_types.insert(name, export);
    }

    pub fn insert_unknown(&mut self, name: String, export: Rc<SymbolExport>) {
        if name == "default" {
            self.set_default_export(SymbolExportDefault::Renamed { export }.into());
            return;
        }
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
pub enum SymbolExportDefault {
    Expr {
        export_expr: Rc<Expr>,
        anchor: Anchor,
    },
    Renamed {
        export: Rc<SymbolExport>,
    },
}
