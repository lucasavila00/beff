use std::{collections::HashMap, rc::Rc};

use swc_common::Span;
use swc_ecma_ast::{Expr, TsEnumDecl, TsInterfaceDecl, TsType, TsTypeAliasDecl};

use crate::{Anchor, BffFileName, FileManager};

pub(crate) mod bind_exports;
pub(crate) mod bind_locals;
pub(crate) mod parse;

#[derive(Debug, Clone)]
pub(crate) enum SymbolExport {
    TsType {
        decl: Rc<TsTypeAliasDecl>,
        original_file: BffFileName,
        name: String,
        span: Span,
    },
    TsInterfaceDecl {
        decl: Rc<TsInterfaceDecl>,
        original_file: BffFileName,
        span: Span,
    },
    TsEnumDecl {
        decl: Rc<TsEnumDecl>,
        original_file: BffFileName,
    },
    ValueExpr {
        expr: Rc<Expr>,
        original_file: BffFileName,
    },
    ExprDecl {
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
pub(crate) enum ImportReference {
    Named {
        original_name: Rc<String>,
        file_name: BffFileName,
        import_statement_anchor: Anchor,
    },
    Star {
        file_name: BffFileName,
    },
    Default {
        file_name: BffFileName,
        import_statement_anchor: Anchor,
    },
}

#[derive(Debug, Clone)]
pub(crate) struct SymbolsExportsModule {
    pub named_types: HashMap<String, Rc<SymbolExport>>,
    pub named_values: HashMap<String, Rc<SymbolExport>>,

    pub named_unknown: HashMap<String, Rc<SymbolExport>>,

    pub extends: Vec<BffFileName>,

    pub export_default: Option<Rc<SymbolExportDefault>>,
}
impl Default for SymbolsExportsModule {
    fn default() -> Self {
        Self::new()
    }
}
impl SymbolsExportsModule {
    pub(crate) fn new() -> SymbolsExportsModule {
        SymbolsExportsModule {
            named_types: HashMap::new(),
            named_values: HashMap::new(),
            named_unknown: HashMap::new(),
            extends: Vec::new(),
            export_default: None,
        }
    }
    pub(crate) fn set_default_export(&mut self, export: Rc<SymbolExportDefault>) {
        if self.export_default.is_some() {
            panic!("Default export already set");
        }
        self.export_default = Some(export);
    }

    pub(crate) fn insert_value(&mut self, name: String, export: Rc<SymbolExport>) {
        if name == "default" {
            self.set_default_export(SymbolExportDefault::Renamed { export }.into());
            return;
        }
        self.named_values.insert(name, export);
    }

    pub(crate) fn get_value<R: FileManager>(
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

    pub(crate) fn insert_type(&mut self, name: String, export: Rc<SymbolExport>) {
        if name == "default" {
            self.set_default_export(SymbolExportDefault::Renamed { export }.into());
            return;
        }
        self.named_types.insert(name, export);
    }

    pub(crate) fn insert_unknown(&mut self, name: String, export: Rc<SymbolExport>) {
        if name == "default" {
            self.set_default_export(SymbolExportDefault::Renamed { export }.into());
            return;
        }
        self.named_unknown.insert(name, export);
    }

    pub(crate) fn get_type<R: FileManager>(
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

    pub(crate) fn extend(&mut self, other: BffFileName) {
        self.extends.push(other);
    }
}

#[derive(Debug)]
pub(crate) enum SymbolExportDefault {
    Expr {
        export_expr: Rc<Expr>,
        anchor: Anchor,
    },
    Renamed {
        export: Rc<SymbolExport>,
    },
}
