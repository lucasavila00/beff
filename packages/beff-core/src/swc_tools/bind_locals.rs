use std::{collections::HashMap, rc::Rc};

use swc_ecma_ast::{
    Decl, Expr, ModuleItem, Pat, Stmt, TsEnumDecl, TsInterfaceDecl, TsType, TsTypeAliasDecl,
};
use swc_ecma_visit::Visit;

#[derive(Debug)]
pub struct ParsedModuleLocals {
    pub type_aliases: HashMap<String, Rc<TsTypeAliasDecl>>,
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
    pub content: ParsedModuleLocals,
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
                        self.handle_var_decl(var_decl);
                    }
                }
                ModuleItem::ModuleDecl(_) => {}
                ModuleItem::Stmt(_) => {}
            }
        }
    }
    fn handle_var_decl(&mut self, var_decl: &swc_ecma_ast::VarDecl) {
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
                        self.content
                            .exprs_decls
                            .insert(id.sym.to_string(), Rc::new(*ann.type_ann.clone()));
                    }
                }
            }
        }
    }
    fn handle_type_alias(&mut self, n: &TsTypeAliasDecl) {
        let TsTypeAliasDecl { id, .. } = n;
        self.content
            .type_aliases
            .insert(id.sym.to_string(), Rc::new(n.clone()));
    }
    fn habdle_enum_decl(&mut self, n: &TsEnumDecl) {
        let TsEnumDecl { id, .. } = n;
        self.content
            .enums
            .insert(id.sym.to_string(), Rc::new(n.clone()));
    }
    fn handle_interface_decl(&mut self, n: &TsInterfaceDecl) {
        let TsInterfaceDecl { id, .. } = n;
        self.content
            .interfaces
            .insert(id.sym.to_string(), Rc::new(n.clone()));
    }
}

impl Visit for ParserOfModuleLocals {
    fn visit_ts_type_alias_decl(&mut self, n: &TsTypeAliasDecl) {
        self.handle_type_alias(n);
    }
    fn visit_ts_interface_decl(&mut self, n: &TsInterfaceDecl) {
        self.handle_interface_decl(n);
    }
    fn visit_ts_enum_decl(&mut self, n: &swc_ecma_ast::TsEnumDecl) {
        self.habdle_enum_decl(n);
    }
    fn visit_export_decl(&mut self, n: &swc_ecma_ast::ExportDecl) {
        match &n.decl {
            Decl::TsInterface(ts_interface_decl) => {
                self.handle_interface_decl(ts_interface_decl);
            }
            Decl::TsTypeAlias(ts_type_alias_decl) => {
                self.handle_type_alias(ts_type_alias_decl);
            }
            Decl::TsEnum(ts_enum_decl) => {
                self.habdle_enum_decl(ts_enum_decl);
            }
            Decl::Var(ts_var_decl) => {
                self.handle_var_decl(ts_var_decl);
            }
            _ => {}
        }
    }
}
