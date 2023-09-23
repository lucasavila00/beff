use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    op, ArrayLit, BinExpr, BindingIdent, BlockStmt, CallExpr, Callee, ComputedPropName, Decl, Expr,
    ExprOrSpread, ExprStmt, ForStmt, Ident, IfStmt, Lit, MemberExpr, MemberProp, Null, Number,
    ParenExpr, Pat, Stmt, Str, UnaryExpr, UnaryOp, UpdateExpr, VarDecl, VarDeclKind, VarDeclOrExpr,
    VarDeclarator,
};

pub struct SwcBuilder;

impl SwcBuilder {
    #[must_use]
    pub fn null() -> Expr {
        Expr::Lit(Lit::Null(Null { span: DUMMY_SP }))
    }

    #[must_use]
    pub fn input_ident() -> Ident {
        Ident {
            span: DUMMY_SP,
            sym: "input".into(),
            optional: false,
        }
    }
    #[must_use]
    pub fn input_expr() -> Expr {
        Expr::Ident(Self::input_ident())
    }
    #[must_use]
    pub fn ident_expr(name: &str) -> Expr {
        Expr::Ident(Ident {
            span: DUMMY_SP,
            sym: name.into(),
            optional: false,
        })
    }

    #[must_use]
    pub fn if_(cond: Expr, then: BlockStmt) -> Stmt {
        Stmt::If(IfStmt {
            span: DUMMY_SP,
            test: cond.into(),
            cons: Stmt::Block(then).into(),
            alt: None,
        })
    }
    #[must_use]
    pub fn if_else(cond: Expr, then: BlockStmt, else_: BlockStmt) -> Stmt {
        Stmt::If(IfStmt {
            span: DUMMY_SP,
            test: cond.into(),
            cons: Stmt::Block(then).into(),
            alt: Some(Stmt::Block(else_).into()),
        })
    }

    fn typeof_(value: Expr) -> Expr {
        Expr::Unary(UnaryExpr {
            span: DUMMY_SP,
            op: UnaryOp::TypeOf,
            arg: Box::new(value),
        })
    }

    #[must_use]
    pub fn not(value: Expr) -> Expr {
        Expr::Unary(UnaryExpr {
            span: DUMMY_SP,
            op: UnaryOp::Bang,
            arg: Box::new(Expr::Paren(ParenExpr {
                span: DUMMY_SP,
                expr: value.into(),
            })),
        })
    }
    #[must_use]
    pub fn diff(value: Expr, rhs: Expr) -> Expr {
        Expr::Bin(BinExpr {
            span: DUMMY_SP,
            op: op!("!="),
            left: value.into(),
            right: rhs.into(),
        })
    }
    fn eq(value: Expr, rhs: Expr) -> Expr {
        Expr::Bin(BinExpr {
            span: DUMMY_SP,
            op: op!("=="),
            left: value.into(),
            right: rhs.into(),
        })
    }
    #[must_use]
    pub fn typeof_diff(value: Expr, rhs: &str) -> Expr {
        Self::diff(
            Self::typeof_(value),
            Expr::Lit(Lit::Str(Str {
                span: DUMMY_SP,
                value: rhs.into(),
                raw: None,
            })),
        )
    }

    #[must_use]
    pub fn typeof_eq(value: Expr, rhs: &str) -> Expr {
        Self::eq(
            Self::typeof_(value),
            Expr::Lit(Lit::Str(Str {
                span: DUMMY_SP,
                value: rhs.into(),
                raw: None,
            })),
        )
    }
    #[must_use]
    pub fn is_array(value: Expr) -> Expr {
        let arr_id = Expr::Ident(Ident {
            span: DUMMY_SP,
            sym: "Array".into(),
            optional: false,
        });
        let arr_is_arr = Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: arr_id.into(),
            prop: MemberProp::Ident(Ident {
                span: DUMMY_SP,
                sym: "isArray".into(),
                optional: false,
            }),
        });
        Expr::Call(CallExpr {
            span: DUMMY_SP,
            callee: Callee::Expr(arr_is_arr.into()),
            args: vec![ExprOrSpread {
                spread: None,
                expr: value.into(),
            }],
            type_args: None,
        })
    }

    pub fn check_runtime_registered_string(type_name: &str, value: Expr) -> Expr {
        let check_custom_string_format = Expr::Ident(Ident {
            span: DUMMY_SP,
            sym: "isCustomFormatInvalid".into(),
            optional: false,
        });
        Expr::Call(CallExpr {
            span: DUMMY_SP,
            callee: Callee::Expr(check_custom_string_format.into()),
            args: vec![
                ExprOrSpread {
                    spread: None,
                    expr: Expr::Lit(Lit::Str(Str {
                        span: DUMMY_SP,
                        value: type_name.to_string().into(),
                        raw: None,
                    }))
                    .into(),
                },
                ExprOrSpread {
                    spread: None,
                    expr: value.into(),
                },
            ],
            type_args: None,
        })
    }
    pub fn check_runtime_codec(type_name: &str, value: Expr) -> Expr {
        let check_custom_string_format = Expr::Ident(Ident {
            span: DUMMY_SP,
            sym: "isCodecInvalid".into(),
            optional: false,
        });
        Expr::Call(CallExpr {
            span: DUMMY_SP,
            callee: Callee::Expr(check_custom_string_format.into()),
            args: vec![
                ExprOrSpread {
                    spread: None,
                    expr: Expr::Lit(Lit::Str(Str {
                        span: DUMMY_SP,
                        value: type_name.to_string().into(),
                        raw: None,
                    }))
                    .into(),
                },
                ExprOrSpread {
                    spread: None,
                    expr: value.into(),
                },
            ],
            type_args: None,
        })
    }

    #[must_use]
    pub fn store_error_vec(storage: &str, args: Vec<ExprOrSpread>) -> Stmt {
        let error_storage_expr = Expr::Ident(Ident {
            span: DUMMY_SP,
            sym: storage.into(),
            optional: false,
        });
        let error_push_callee = Callee::Expr(
            Expr::Member(MemberExpr {
                span: DUMMY_SP,
                obj: error_storage_expr.into(),
                prop: MemberProp::Ident(Ident {
                    span: DUMMY_SP,
                    sym: "push".into(),
                    optional: false,
                }),
            })
            .into(),
        );
        Stmt::Expr(ExprStmt {
            span: DUMMY_SP,
            expr: Box::new(Expr::Call(CallExpr {
                span: DUMMY_SP,
                callee: error_push_callee,
                args,
                type_args: None,
            })),
        })
    }

    #[must_use]
    pub fn error_storage_stmt(id: &str) -> Stmt {
        let is_ok_tmp = Self::declare_var(
            id,
            Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems: vec![],
            }),
        );

        Stmt::Decl(Decl::Var(is_ok_tmp.into()))
    }

    #[must_use]
    pub fn is_not_null(t: &Expr) -> Expr {
        Expr::Bin(BinExpr {
            span: DUMMY_SP,
            op: op!("!="),
            left: Box::new(t.clone()),
            right: Expr::Lit(Lit::Null(Null { span: DUMMY_SP })).into(),
        })
    }
    #[must_use]
    pub fn is_null(t: &Expr) -> Expr {
        Expr::Bin(BinExpr {
            span: DUMMY_SP,
            op: op!("=="),
            left: Box::new(t.clone()),
            right: Expr::Lit(Lit::Null(Null { span: DUMMY_SP })).into(),
        })
    }
    #[must_use]
    pub fn declare_var(name: &str, init: Expr) -> VarDecl {
        VarDecl {
            span: DUMMY_SP,
            kind: VarDeclKind::Let,
            declare: false,
            decls: vec![VarDeclarator {
                span: DUMMY_SP,
                name: Pat::Ident(BindingIdent {
                    id: Ident {
                        span: DUMMY_SP,
                        sym: name.into(),
                        optional: false,
                    },
                    type_ann: None,
                }),
                init: Some(Box::new(init)),
                definite: false,
            }],
        }
    }

    #[must_use]
    pub fn and(left: Expr, right: Expr) -> Expr {
        Expr::Bin(BinExpr {
            span: DUMMY_SP,
            op: op!("&&"),
            left: Box::new(left),
            right: Box::new(right),
        })
    }

    #[must_use]
    pub fn member_expr_idx(value_ref: &Expr, k: f64) -> Expr {
        Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: Box::new(value_ref.clone()),
            prop: MemberProp::Computed(ComputedPropName {
                span: DUMMY_SP,
                expr: Expr::Lit(Lit::Num(Number {
                    span: DUMMY_SP,
                    value: k,
                    raw: None,
                }))
                .into(),
            }),
        })
    }

    pub fn member_expr_computed(value_ref: &Expr, k: Expr) -> Expr {
        Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: Box::new(value_ref.clone()),
            prop: MemberProp::Computed(ComputedPropName {
                span: DUMMY_SP,
                expr: k.into(),
            }),
        })
    }

    #[must_use]
    pub fn member_expr_computed_key(value_ref: &Expr, k: &str) -> Expr {
        Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: Box::new(value_ref.clone()),
            prop: MemberProp::Computed(ComputedPropName {
                span: DUMMY_SP,
                expr: Expr::Lit(Lit::Str(Str {
                    span: DUMMY_SP,
                    value: k.into(),
                    raw: None,
                }))
                .into(),
            }),
        })
    }
    #[must_use]
    pub fn member_expr_key(value_ref: &Expr, k: &str) -> Expr {
        Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: Box::new(value_ref.clone()),
            prop: MemberProp::Ident(Ident {
                span: DUMMY_SP,
                sym: k.into(),
                optional: false,
            }),
        })
    }

    #[must_use]
    pub fn for_of_indexed(var_id: &str, container: &Expr, stmts: Vec<Stmt>) -> Stmt {
        Stmt::For(ForStmt {
            span: DUMMY_SP,
            init: Some(VarDeclOrExpr::VarDecl(
                VarDecl {
                    span: DUMMY_SP,
                    kind: VarDeclKind::Let,
                    declare: false,
                    decls: vec![VarDeclarator {
                        span: DUMMY_SP,
                        name: Pat::Ident(
                            Ident {
                                span: DUMMY_SP,
                                sym: "index".into(),
                                optional: false,
                            }
                            .into(),
                        ),
                        init: Some(Box::new(Expr::Lit(Lit::Num(Number {
                            span: DUMMY_SP,
                            value: 0.0,
                            raw: None,
                        })))),
                        definite: false,
                    }],
                }
                .into(),
            )),
            test: Some(
                Expr::Bin(BinExpr {
                    span: DUMMY_SP,
                    op: op!("<"),
                    left: Expr::Ident(Ident {
                        span: DUMMY_SP,
                        sym: "index".into(),
                        optional: false,
                    })
                    .into(),
                    right: Expr::Member(MemberExpr {
                        span: DUMMY_SP,
                        obj: Box::new(container.clone()),
                        prop: MemberProp::Ident(Ident {
                            span: DUMMY_SP,
                            sym: "length".into(),
                            optional: false,
                        }),
                    })
                    .into(),
                })
                .into(),
            ),
            update: Some(
                Expr::Update(UpdateExpr {
                    span: DUMMY_SP,
                    op: op!("++"),
                    prefix: false,
                    arg: Box::new(Expr::Ident(Ident {
                        span: DUMMY_SP,
                        sym: "index".into(),
                        optional: false,
                    })),
                })
                .into(),
            ),
            body: Stmt::Block(BlockStmt {
                span: DUMMY_SP,
                stmts: vec![Stmt::Decl(Decl::Var(
                    VarDecl {
                        span: DUMMY_SP,
                        kind: VarDeclKind::Const,
                        declare: false,
                        decls: vec![VarDeclarator {
                            span: DUMMY_SP,
                            name: Pat::Ident(
                                Ident {
                                    span: DUMMY_SP,
                                    sym: var_id.into(),
                                    optional: false,
                                }
                                .into(),
                            ),
                            init: Some(Box::new(Self::member_expr_computed(
                                container,
                                Expr::Ident(Ident {
                                    span: DUMMY_SP,
                                    sym: "index".into(),
                                    optional: false,
                                }),
                            ))),
                            definite: false,
                        }],
                    }
                    .into(),
                ))]
                .into_iter()
                .chain(stmts)
                .collect(),
            })
            .into(),
        })
    }
}
