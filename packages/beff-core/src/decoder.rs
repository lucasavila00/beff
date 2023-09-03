use std::rc::Rc;

use crate::open_api_ast::{Js, Json, JsonSchema, Optionality};
use crate::printer::ToExpr;
use crate::swc_builder::SwcBuilder;
use swc_common::DUMMY_SP;
use swc_ecma_ast::{
    op, AssignExpr, BinExpr, BinaryOp, BindingIdent, BlockStmt, Bool, CallExpr, Callee, Decl, Expr,
    ExprOrSpread, ExprStmt, Function, Ident, Lit, MemberExpr, MemberProp, Number, Param, Pat,
    PatOrExpr, ReturnStmt, Stmt, Str,
};

fn store_error(storage: &str, err: ReportedError, received: Expr) -> Stmt {
    SwcBuilder::store_error_vec(
        storage,
        vec![ExprOrSpread {
            spread: None,
            expr: err.convert_to_js(received).to_expr().into(),
        }],
    )
}

fn wrap_decoder_call(it: Expr, path: &[DecodePath]) -> Expr {
    Expr::Call(CallExpr {
        span: DUMMY_SP,
        callee: Callee::Expr(
            Expr::Ident(Ident {
                span: DUMMY_SP,
                sym: "add_path_to_errors".into(),
                optional: false,
            })
            .into(),
        ),
        args: vec![
            ExprOrSpread {
                spread: None,
                expr: it.into(),
            },
            ExprOrSpread {
                spread: None,
                expr: ReportedError::print_path(path).to_expr().into(),
            },
        ],
        type_args: None,
    })
}
enum DecodeError {
    NotAnObject,
    NotAnArray,
    NotTypeof(String),
    NotEq(Json),
    InvalidUnion,
    StringFormatCheckFailed { name_of_type: String },
}

fn decode_error_variant(
    tag: &str,
    path: Js,
    received: Expr,
    rest: Option<Vec<(String, Js)>>,
) -> Js {
    Js::Object(
        vec![
            ("error_kind".into(), Js::String(tag.to_owned())),
            ("path".into(), path),
            ("received".into(), Js::Expr(received)),
        ]
        .into_iter()
        .chain(rest.unwrap_or(vec![]))
        .collect(),
    )
}
impl DecodeError {
    fn convert_to_js(self, path: Js, received: Expr) -> Js {
        match self {
            DecodeError::NotAnObject => decode_error_variant("NotAnObject", path, received, None),
            DecodeError::NotAnArray => decode_error_variant("NotAnArray", path, received, None),
            DecodeError::NotTypeof(t) => decode_error_variant(
                "NotTypeof",
                path,
                received,
                Some(vec![("expected_type".into(), Js::String(t.to_owned()))]),
            ),
            DecodeError::NotEq(e) => decode_error_variant(
                "NotEq",
                path,
                received,
                Some(vec![("expected_value".into(), e.to_js())]),
            ),
            DecodeError::InvalidUnion => decode_error_variant("InvalidUnion", path, received, None),
            DecodeError::StringFormatCheckFailed { name_of_type } => decode_error_variant(
                "StringFormatCheckFailed",
                path,
                received,
                Some(vec![(
                    "expected_type".into(),
                    Js::String(name_of_type.to_owned()),
                )]),
            ),
        }
    }
}

#[derive(Clone)]
enum DecodePath {
    Ident(Rc<String>),
    ArrayItem,
    TupleItem(usize),
}
struct ReportedError {
    kind: DecodeError,
    path: Vec<DecodePath>,
}

fn decode_array_item() -> Js {
    let first_add = Expr::Bin(BinExpr {
        span: DUMMY_SP,
        op: BinaryOp::Add,
        left: Expr::Lit(Lit::Str(Str {
            span: DUMMY_SP,
            value: "[".into(),
            raw: None,
        }))
        .into(),
        right: Expr::Ident(Ident {
            span: DUMMY_SP,
            sym: "index".into(),
            optional: false,
        })
        .into(),
    });
    Js::Expr(Expr::Bin(BinExpr {
        span: DUMMY_SP,
        op: BinaryOp::Add,
        left: first_add.into(),
        right: Expr::Lit(Lit::Str(Str {
            span: DUMMY_SP,
            value: "]".into(),
            raw: None,
        }))
        .into(),
    }))
}

impl ReportedError {
    pub fn print_path(it: &[DecodePath]) -> Js {
        Js::Array(
            it.iter()
                .map(|it| match it {
                    DecodePath::Ident(id) => Js::String(id.to_string()),
                    DecodePath::ArrayItem => decode_array_item(),
                    DecodePath::TupleItem(idx) => Js::String(format!("[{idx}]")),
                })
                .collect(),
        )
    }
    fn convert_to_js(self, received: Expr) -> Js {
        self.kind
            .convert_to_js(Self::print_path(&self.path), received)
    }
}
fn schema_ref_callee_validate(schema_ref: &String) -> Callee {
    let decoder_ref_fn = Ident {
        span: DUMMY_SP,
        sym: format!("validate_{schema_ref}").into(),
        optional: false,
    };
    Callee::Expr(Expr::Ident(decoder_ref_fn).into())
}
struct DecoderFnGenerator {
    increasing_id: usize,
}

impl DecoderFnGenerator {
    fn decode_object(
        &mut self,
        els: &[(String, Optionality<JsonSchema>)],
        value_ref: &Expr,
        err_storage: &str,
        path: &[DecodePath],
    ) -> Vec<Stmt> {
        let vs: Vec<Stmt> = els
            .iter()
            .flat_map(|(k, o)| {
                let value_ref_item = SwcBuilder::member_expr_computed_key(value_ref, k);
                let mut new_path = path.to_vec();
                new_path.push(DecodePath::Ident(Rc::new(k.to_owned())));
                match o {
                    Optionality::Optional(t) => vec![SwcBuilder::if_(
                        SwcBuilder::is_not_null(&value_ref_item),
                        BlockStmt {
                            span: DUMMY_SP,
                            stmts: self.convert_to_decoder(
                                t,
                                &value_ref_item,
                                err_storage,
                                &new_path,
                            ),
                        },
                    )],
                    Optionality::Required(t) => {
                        self.convert_to_decoder(t, &value_ref_item, err_storage, &new_path)
                    }
                }
            })
            .collect();

        vec![SwcBuilder::if_else(
            SwcBuilder::and(
                SwcBuilder::typeof_eq(value_ref.clone(), "object"),
                SwcBuilder::diff(value_ref.clone(), SwcBuilder::null()),
            ),
            BlockStmt {
                span: DUMMY_SP,
                stmts: vs,
            },
            BlockStmt {
                span: DUMMY_SP,
                stmts: vec![store_error(
                    err_storage,
                    ReportedError {
                        kind: DecodeError::NotAnObject,
                        path: path.to_vec(),
                    },
                    value_ref.clone(),
                )],
            },
        )]
    }

    fn decode_tuple(
        &mut self,
        prefixes: &Vec<JsonSchema>,
        items: &Option<Box<JsonSchema>>,
        value_ref: &Expr,
        err_storage: &str,
        path: &[DecodePath],
    ) -> Vec<Stmt> {
        let mut then_items_check = vec![];
        let pref_len = prefixes.len() as f64;

        for (idx, prefix) in prefixes.iter().enumerate() {
            let array_item_id = SwcBuilder::member_expr_idx(value_ref, idx as f64);
            let mut new_path = path.to_vec();
            new_path.push(DecodePath::TupleItem(idx));
            let array_item_check =
                self.convert_to_decoder(prefix, &array_item_id, err_storage, &new_path);
            then_items_check.extend(array_item_check);
        }

        match items {
            Some(el) => {
                let sub_arr = Expr::Call(CallExpr {
                    span: DUMMY_SP,
                    callee: Callee::Expr(SwcBuilder::member_expr_key(value_ref, "slice").into()),
                    args: vec![ExprOrSpread {
                        spread: None,
                        expr: Expr::Lit(Lit::Num(Number {
                            span: DUMMY_SP,
                            value: pref_len,
                            raw: None,
                        }))
                        .into(),
                    }],
                    type_args: None,
                });
                let mut new_path = path.to_vec();
                new_path.push(DecodePath::ArrayItem);
                let rest_check = self.decode_array(el, &sub_arr, err_storage, &new_path);

                then_items_check.extend(rest_check);
            }
            None => {}
        }

        vec![SwcBuilder::if_else(
            SwcBuilder::is_array(value_ref.clone()),
            BlockStmt {
                span: DUMMY_SP,
                stmts: then_items_check,
            },
            BlockStmt {
                span: DUMMY_SP,
                stmts: vec![store_error(
                    err_storage,
                    ReportedError {
                        kind: DecodeError::NotAnArray,
                        path: path.to_vec(),
                    },
                    value_ref.clone(),
                )],
            },
        )]
    }
    fn decode_array(
        &mut self,
        el: &JsonSchema,
        value_ref: &Expr,
        err_storage: &str,
        path: &[DecodePath],
    ) -> Vec<Stmt> {
        let id = self.new_arr_item_id();
        let array_item_id = Ident {
            span: DUMMY_SP,
            sym: id.as_str().into(),
            optional: false,
        };
        let mut new_path = path.to_vec();
        new_path.push(DecodePath::ArrayItem);
        let then_items_check = vec![SwcBuilder::for_of_indexed(
            &id,
            value_ref,
            self.convert_to_decoder(el, &Expr::Ident(array_item_id), err_storage, &new_path),
        )];

        vec![SwcBuilder::if_else(
            SwcBuilder::is_array(value_ref.clone()),
            BlockStmt {
                span: DUMMY_SP,
                stmts: then_items_check,
            },
            BlockStmt {
                span: DUMMY_SP,
                stmts: vec![store_error(
                    err_storage,
                    ReportedError {
                        kind: DecodeError::NotAnArray,
                        path: path.to_vec(),
                    },
                    value_ref.clone(),
                )],
            },
        )]
    }
    fn decode_ref(
        schema_ref: &String,
        value_ref: &Expr,
        err_storage: &str,
        path: &[DecodePath],
    ) -> Vec<Stmt> {
        let call_dec = Expr::Call(CallExpr {
            span: DUMMY_SP,
            callee: schema_ref_callee_validate(schema_ref),
            args: vec![ExprOrSpread {
                spread: None,
                expr: value_ref.clone().into(),
            }],
            type_args: None,
        });
        let dec_with_path = wrap_decoder_call(call_dec, path);
        let st = SwcBuilder::store_error_vec(
            err_storage,
            vec![ExprOrSpread {
                spread: Some(DUMMY_SP),
                expr: dec_with_path.into(),
            }],
        );
        vec![st]
    }

    fn decode_with_typeof(
        value_ref: &Expr,
        t: &str,
        err_storage: &str,
        path: &[DecodePath],
    ) -> Vec<Stmt> {
        let str_check = SwcBuilder::if_(
            SwcBuilder::typeof_diff(value_ref.clone(), t),
            BlockStmt {
                span: DUMMY_SP,
                stmts: vec![store_error(
                    err_storage,
                    ReportedError {
                        kind: DecodeError::NotTypeof(t.into()),
                        path: path.to_vec(),
                    },
                    value_ref.clone(),
                )],
            },
        );
        vec![str_check]
    }

    fn decode_with_eq(
        value_ref: &Expr,
        t: Json,
        err_storage: &str,
        path: &[DecodePath],
    ) -> Vec<Stmt> {
        let check = SwcBuilder::if_(
            SwcBuilder::diff(value_ref.clone(), t.clone().to_expr()),
            BlockStmt {
                span: DUMMY_SP,
                stmts: vec![store_error(
                    err_storage,
                    ReportedError {
                        kind: DecodeError::NotEq(t),
                        path: path.to_vec(),
                    },
                    value_ref.clone(),
                )],
            },
        );
        vec![check]
    }
    fn decode_runtime_registered_string(
        &mut self,
        name_of_type: &String,
        value_ref: &Expr,
        err_storage: &str,
        path: &[DecodePath],
    ) -> Vec<Stmt> {
        let check = SwcBuilder::if_(
            SwcBuilder::check_runtime_registered_string(name_of_type, value_ref.clone()),
            BlockStmt {
                span: DUMMY_SP,
                stmts: vec![store_error(
                    err_storage,
                    ReportedError {
                        kind: DecodeError::StringFormatCheckFailed {
                            name_of_type: name_of_type.to_owned(),
                        },
                        path: path.to_vec(),
                    },
                    value_ref.clone(),
                )],
            },
        );
        vec![check]
    }

    fn convert_to_decoder(
        &mut self,
        el: &JsonSchema,
        value_ref: &Expr,
        err_storage: &str,
        path: &[DecodePath],
    ) -> Vec<Stmt> {
        match el {
            JsonSchema::String => Self::decode_with_typeof(value_ref, "string", err_storage, path),
            JsonSchema::Ref(schema_ref) => {
                Self::decode_ref(schema_ref, value_ref, err_storage, path)
            }
            JsonSchema::Null => Self::decode_with_eq(value_ref, Json::Null, err_storage, path),
            JsonSchema::Boolean => {
                Self::decode_with_typeof(value_ref, "boolean", err_storage, path)
            }
            JsonSchema::Number => Self::decode_with_typeof(value_ref, "number", err_storage, path),
            JsonSchema::Any => vec![],
            JsonSchema::Object { values } => {
                self.decode_object(values, value_ref, err_storage, path)
            }
            JsonSchema::Array(el) => self.decode_array(el, value_ref, err_storage, path),
            JsonSchema::AnyOf(els) => self.decode_any_of(els, value_ref, err_storage, path),
            JsonSchema::Const(the_const) => {
                Self::decode_with_eq(value_ref, the_const.clone(), err_storage, path)
            }
            JsonSchema::Tuple {
                prefix_items,
                items,
            } => self.decode_tuple(prefix_items, items, value_ref, err_storage, path),
            JsonSchema::AllOf(els) => self.decode_all_of(els, value_ref, err_storage, path),
            JsonSchema::OpenApiResponseRef(_) => unreachable!("will not decode error schema"),
            JsonSchema::StringWithFormat(it) => {
                self.decode_runtime_registered_string(it, value_ref, err_storage, path)
            }
        }
    }

    fn new_arr_item_id(&mut self) -> String {
        let id = format!("array_item_{}", self.increasing_id);
        self.increasing_id += 1;
        id
    }
    fn new_err_acc_id(&mut self) -> String {
        let id = format!("error_acc_{}", self.increasing_id);
        self.increasing_id += 1;
        id
    }
    fn new_is_ok_id(&mut self) -> String {
        let id = format!("is_ok_{}", self.increasing_id);
        self.increasing_id += 1;
        id
    }
    fn decode_all_of(
        &mut self,
        els: &[JsonSchema],
        value_ref: &Expr,
        parent_err_storage: &str,
        path: &[DecodePath],
    ) -> Vec<Stmt> {
        els.iter()
            .flat_map(|el| self.convert_to_decoder(el, value_ref, parent_err_storage, path))
            .collect()
    }

    fn decode_any_of(
        &mut self,
        els: &Vec<JsonSchema>,
        value_ref: &Expr,
        parent_err_storage: &str,
        path: &[DecodePath],
    ) -> Vec<Stmt> {
        let mut stmts = vec![];
        let is_ok_id = self.new_is_ok_id();
        let any_err_storage = SwcBuilder::declare_var(
            &is_ok_id,
            Expr::Lit(Lit::Bool(Bool {
                span: DUMMY_SP,
                value: false,
            })),
        );
        stmts.push(Stmt::Decl(Decl::Var(any_err_storage.into())));

        for el in els {
            let curr_err_storage = &self.new_err_acc_id();
            let err_storage = SwcBuilder::error_storage_stmt(curr_err_storage);
            stmts.push(err_storage);

            let el_decoder = self.convert_to_decoder(el, value_ref, curr_err_storage, path);
            stmts.extend(el_decoder);

            let is_ok_current = Expr::Bin(BinExpr {
                span: DUMMY_SP,
                op: op!("==="),
                left: Expr::Member(MemberExpr {
                    span: DUMMY_SP,
                    obj: Expr::Ident(Ident {
                        span: DUMMY_SP,
                        sym: curr_err_storage.clone().into(),
                        optional: false,
                    })
                    .into(),
                    prop: MemberProp::Ident(Ident {
                        span: DUMMY_SP,
                        sym: "length".into(),
                        optional: false,
                    }),
                })
                .into(),
                right: Expr::Lit(Lit::Num(Number {
                    span: DUMMY_SP,
                    value: 0.0,
                    raw: None,
                }))
                .into(),
            });

            let is_ok_update = Stmt::Expr(ExprStmt {
                span: DUMMY_SP,
                expr: Box::new(Expr::Assign(AssignExpr {
                    span: DUMMY_SP,
                    op: op!("="),
                    left: PatOrExpr::Expr(
                        Expr::Ident(Ident {
                            span: DUMMY_SP,
                            sym: is_ok_id.clone().into(),
                            optional: false,
                        })
                        .into(),
                    ),
                    right: Expr::Bin(BinExpr {
                        span: DUMMY_SP,
                        op: op!("||"),
                        left: Expr::Ident(Ident {
                            span: DUMMY_SP,
                            sym: is_ok_id.clone().into(),
                            optional: false,
                        })
                        .into(),
                        right: is_ok_current.into(),
                    })
                    .into(),
                })),
            });

            stmts.push(is_ok_update);
        }

        let st = store_error(
            parent_err_storage,
            ReportedError {
                kind: DecodeError::InvalidUnion,
                path: path.to_vec(),
            },
            value_ref.clone(),
        );

        let if_st = SwcBuilder::if_(
            SwcBuilder::not(Expr::Ident(Ident {
                span: DUMMY_SP,
                sym: is_ok_id.clone().into(),
                optional: false,
            })),
            BlockStmt {
                span: DUMMY_SP,
                stmts: vec![st],
            },
        );

        stmts.push(if_st);

        stmts
    }

    fn fn_decoder_from_schema(
        &mut self,
        schema: &JsonSchema,
        name_to_report_err: &Option<String>,
    ) -> Function {
        let input = SwcBuilder::input_expr();

        let tmp_id = self.new_err_acc_id();
        let mut stmts = vec![];
        let err_storage = SwcBuilder::error_storage_stmt(&tmp_id);
        stmts.push(err_storage);

        let path = match name_to_report_err {
            Some(name_to_report_err) => {
                vec![DecodePath::Ident(Rc::new(name_to_report_err.to_owned()))]
            }
            None => vec![],
        };
        let dec_stmts = self.convert_to_decoder(schema, &input, &tmp_id, &path);
        stmts.extend(dec_stmts);

        stmts.push(Stmt::Return(ReturnStmt {
            span: DUMMY_SP,
            arg: Some(Box::new(Expr::Ident(Ident {
                span: DUMMY_SP,
                sym: tmp_id.into(),
                optional: false,
            }))),
        }));
        Function {
            params: vec![Param {
                span: DUMMY_SP,
                decorators: vec![],
                pat: Pat::Ident(BindingIdent {
                    id: SwcBuilder::input_ident(),
                    type_ann: None,
                }),
            }],
            decorators: vec![],
            span: DUMMY_SP,
            body: BlockStmt {
                span: DUMMY_SP,
                stmts,
            }
            .into(),
            is_async: false,
            is_generator: false,
            type_params: None,
            return_type: None,
        }
    }
}
#[must_use]
pub fn from_schema(schema: &JsonSchema, name_to_report_err: &Option<String>) -> Function {
    DecoderFnGenerator { increasing_id: 0 }.fn_decoder_from_schema(schema, name_to_report_err)
}
