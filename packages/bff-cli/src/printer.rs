use swc_common::{FileName, DUMMY_SP};
use swc_ecma_ast::{
    ArrayLit, BindingIdent, Bool, Decl, ExportDecl, Expr, ExprOrSpread, FnDecl, FnExpr, Ident,
    KeyValueProp, Lit, Module, ModuleDecl, ModuleItem, Null, Number, ObjectLit, Pat, Prop,
    PropName, PropOrSpread, Stmt, Str, VarDecl, VarDeclKind, VarDeclarator,
};

use crate::{
    api_extractor::{
        operation_parameter_in_path_or_query_or_body, FnHandler, FunctionParameterIn,
        HandlerParameter, HeaderOrCookie, ParsedPattern,
    },
    coercer, decoder,
    diag::Diagnostic,
    open_api_ast::{self, Definition, Js, Json, JsonSchema, OpenApi},
    BundleResult,
};

pub trait ToExpr {
    fn to_expr(self) -> Expr;
}
impl ToExpr for Json {
    fn to_expr(self) -> Expr {
        match self {
            Json::Null => Expr::Lit(Lit::Null(Null { span: DUMMY_SP })),
            Json::Bool(v) => Expr::Lit(Lit::Bool(Bool {
                span: DUMMY_SP,
                value: v,
            })),
            Json::Number(n) => Expr::Lit(Lit::Num(Number {
                span: DUMMY_SP,
                value: n,
                raw: None,
            })),
            Json::String(v) => Expr::Lit(Lit::Str(Str {
                span: DUMMY_SP,
                value: v.into(),
                raw: None,
            })),
            Json::Array(els) => Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems: els
                    .into_iter()
                    .map(|it| {
                        Some(ExprOrSpread {
                            spread: None,
                            expr: Box::new(it.to_expr()),
                        })
                    })
                    .collect(),
            }),
            Json::Object(kvs) => Expr::Object(ObjectLit {
                span: DUMMY_SP,
                props: kvs
                    .into_iter()
                    .map(|(key, value)| {
                        PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                            key: PropName::Str(Str {
                                span: DUMMY_SP,
                                value: key.into(),
                                raw: None,
                            }),
                            value: Box::new(value.to_expr()),
                        })))
                    })
                    .collect(),
            }),
        }
    }
}

trait ToJson {
    fn to_json(self) -> Json;
}
trait ToJsonKv {
    fn to_json_kv(self) -> Vec<(String, Json)>;
}

impl ToJson for JsonSchema {
    #[allow(clippy::cast_precision_loss)]
    fn to_json(self) -> Json {
        match self {
            JsonSchema::String => {
                Json::Object(vec![("type".into(), Json::String("string".into()))])
            }
            JsonSchema::Object { values } => {
                Json::Object(vec![
                    //
                    ("type".into(), Json::String("object".into())),
                    (
                        "required".into(),
                        //
                        Json::Array(
                            values
                                .iter()
                                .filter(|(_k, v)| v.is_required())
                                .map(|(k, _v)| Json::String(k.clone()))
                                .collect(),
                        ),
                    ),
                    (
                        "properties".into(),
                        //
                        Json::Object(
                            values
                                .into_iter()
                                .map(|(k, v)| (k, v.inner_move().to_json()))
                                .collect(),
                        ),
                    ),
                ])
            }
            JsonSchema::Array(typ) => {
                Json::Object(vec![
                    //
                    ("type".into(), Json::String("array".into())),
                    ("items".into(), (*typ).to_json()),
                ])
            }
            JsonSchema::Boolean => {
                Json::Object(vec![("type".into(), Json::String("boolean".into()))])
            }
            JsonSchema::Number => {
                Json::Object(vec![("type".into(), Json::String("number".into()))])
            }
            JsonSchema::Any => Json::Object(vec![]),
            JsonSchema::Ref(reference) => Json::Object(vec![(
                "$ref".into(),
                Json::String(format!("#/components/schemas/{reference}")),
            )]),
            JsonSchema::Integer => {
                Json::Object(vec![("type".into(), Json::String("integer".into()))])
            }
            JsonSchema::Null => Json::Object(vec![("type".into(), Json::String("null".into()))]),
            JsonSchema::AnyOf(types) => {
                let all_literals = types.iter().all(|it| matches!(it, JsonSchema::Const(_)));
                if all_literals {
                    let vs = types
                        .into_iter()
                        .map(|it| match it {
                            JsonSchema::Const(e) => e,
                            _ => unreachable!("should have been caught by all_literals check"),
                        })
                        .collect();
                    Json::Object(vec![("enum".into(), Json::Array(vs))])
                } else {
                    let vs = types.into_iter().map(ToJson::to_json).collect();
                    Json::Object(vec![("anyOf".into(), Json::Array(vs))])
                }
            }
            JsonSchema::AllOf(types) => Json::Object(vec![(
                "allOf".into(),
                Json::Array(types.into_iter().map(ToJson::to_json).collect()),
            )]),

            JsonSchema::Tuple {
                prefix_items,
                items,
            } => {
                let mut v = vec![
                    //
                    ("type".into(), Json::String("array".into())),
                ];
                let len_f = prefix_items.len() as f64;
                if !prefix_items.is_empty() {
                    v.push((
                        "prefixItems".into(),
                        Json::Array(prefix_items.into_iter().map(ToJson::to_json).collect()),
                    ));
                }
                if let Some(ty) = items {
                    v.push(("items".into(), ty.to_json()));
                } else {
                    v.push(("minItems".into(), Json::Number(len_f)));
                    v.push(("maxItems".into(), Json::Number(len_f)));
                }
                Json::Object(v)
            }
            JsonSchema::Const(val) => Json::Object(vec![("const".into(), val)]),
        }
    }
}
impl ToJson for open_api_ast::ParameterObject {
    fn to_json(self) -> Json {
        let mut v = vec![];
        v.push(("name".into(), Json::String(self.name)));
        v.push(("in".into(), Json::String(self.in_.to_string())));
        if let Some(desc) = self.description {
            v.push(("description".into(), Json::String(desc)));
        }
        v.push(("required".into(), Json::Bool(self.required)));
        v.push(("schema".into(), self.schema.to_json()));
        Json::Object(v)
    }
}
impl ToJson for open_api_ast::JsonRequestBody {
    fn to_json(self) -> Json {
        let mut v = vec![];
        if let Some(desc) = self.description {
            v.push(("description".into(), Json::String(desc)));
        }
        v.push(("required".into(), Json::Bool(self.required)));
        let content = Json::Object(vec![(
            "application/json".into(),
            Json::Object(vec![("schema".into(), self.schema.to_json())]),
        )]);
        v.push(("content".into(), content));
        Json::Object(v)
    }
}
impl ToJson for open_api_ast::OperationObject {
    fn to_json(self) -> Json {
        let mut v = vec![];
        if let Some(summary) = self.summary {
            v.push(("summary".into(), Json::String(summary)));
        }
        if let Some(desc) = self.description {
            v.push(("description".into(), Json::String(desc)));
        }
        if let Some(body) = self.json_request_body {
            v.push(("requestBody".into(), body.to_json()));
        }
        v.push((
            "parameters".into(),
            Json::Array(self.parameters.into_iter().map(ToJson::to_json).collect()),
        ));
        v.push((
            "responses".into(),
            Json::Object(vec![(
                "200".into(),
                Json::Object(vec![
                    (
                        "description".into(),
                        Json::String("successful operation".into()),
                    ),
                    (
                        "content".into(),
                        Json::Object(vec![(
                            "application/json".into(),
                            Json::Object(vec![(
                                "schema".into(),
                                self.json_response_body.to_json(),
                            )]),
                        )]),
                    ),
                ]),
            )]),
        ));

        Json::Object(v)
    }
}

impl ToJsonKv for open_api_ast::ApiPath {
    fn to_json_kv(self) -> Vec<(String, Json)> {
        let mut v = vec![];
        if let Some(get) = self.get {
            v.push(("get".into(), get.to_json()));
        }
        if let Some(post) = self.post {
            v.push(("post".into(), post.to_json()));
        }
        if let Some(put) = self.put {
            v.push(("put".into(), put.to_json()));
        }
        if let Some(delete) = self.delete {
            v.push(("delete".into(), delete.to_json()));
        }
        if let Some(patch) = self.patch {
            v.push(("patch".into(), patch.to_json()));
        }
        if let Some(options) = self.options {
            v.push(("options".into(), options.to_json()));
        }
        if v.is_empty() {
            return vec![];
        }
        vec![(self.pattern.clone(), Json::Object(v))]
    }
}
impl ToJsonKv for open_api_ast::Definition {
    fn to_json_kv(self) -> Vec<(String, Json)> {
        vec![(self.name.clone(), self.schema.to_json())]
    }
}
impl ToJson for open_api_ast::Info {
    fn to_json(self) -> Json {
        let mut v = vec![];
        if let Some(desc) = self.description {
            v.push(("description".into(), Json::String(desc)));
        }
        v.push((
            "title".into(),
            Json::String(self.title.unwrap_or("No title".to_owned())),
        ));
        v.push((
            "version".into(),
            Json::String(self.version.unwrap_or("0.0.0".to_owned())),
        ));
        Json::Object(v)
    }
}
impl ToJson for OpenApi {
    fn to_json(self) -> Json {
        let v = vec![
            //
            ("openapi".into(), Json::String("3.1.0".into())),
            ("info".into(), self.info.to_json()),
            (
                "paths".into(),
                Json::Object(
                    self.paths
                        .into_iter()
                        .flat_map(ToJsonKv::to_json_kv)
                        .collect(),
                ),
            ),
            (
                "components".into(),
                Json::Object(vec![(
                    "schemas".into(),
                    Json::Object(
                        self.components
                            .into_iter()
                            .flat_map(ToJsonKv::to_json_kv)
                            .collect(),
                    ),
                )]),
            ),
        ];
        Json::Object(v)
    }
}

fn param_to_js(
    name: &str,
    param: HandlerParameter,
    pattern: &ParsedPattern,
    components: &Vec<Definition>,
) -> Js {
    match param {
        HandlerParameter::PathOrQueryOrBody {
            schema, required, ..
        } => {
            match operation_parameter_in_path_or_query_or_body(&name, pattern, &schema, components)
            {
                FunctionParameterIn::Path => Js::Object(vec![
                    ("type".into(), Js::String("path".into())),
                    ("name".into(), Js::String(name.to_string())),
                    ("required".into(), Js::Bool(required)),
                    (
                        "validator".into(),
                        Js::Decoder(format!("Path Parameter \"{name}\""), schema.clone()),
                    ),
                    ("coercer".into(), Js::Coercer(schema)),
                ]),
                FunctionParameterIn::Query => Js::Object(vec![
                    ("type".into(), Js::String("query".into())),
                    ("name".into(), Js::String(name.to_string())),
                    ("required".into(), Js::Bool(required)),
                    (
                        "validator".into(),
                        Js::Decoder(format!("Query Parameter \"{name}\""), schema.clone()),
                    ),
                    ("coercer".into(), Js::Coercer(schema)),
                ]),
                FunctionParameterIn::Body => Js::Object(vec![
                    ("type".into(), Js::String("body".into())),
                    ("name".into(), Js::String(name.to_string())),
                    ("required".into(), Js::Bool(required)),
                    (
                        "validator".into(),
                        Js::Decoder(format!("Request Body"), schema.clone()),
                    ),
                ]),
                FunctionParameterIn::InvalidComplexPathParameter => {
                    unreachable!("will fail when extracting the json schema")
                }
            }
        }
        HandlerParameter::HeaderOrCookie {
            kind,
            schema,
            required,
            ..
        } => {
            let kind_name = match kind {
                HeaderOrCookie::Header => "Header Argument",
                HeaderOrCookie::Cookie => "Cookie Argument",
            };
            Js::Object(vec![
                //
                ("type".into(), Js::String(kind.to_string())),
                ("name".into(), Js::String(name.to_string())),
                ("required".into(), Js::Bool(required)),
                (
                    "validator".into(),
                    Js::Decoder(format!("{kind_name} \"{name}\""), schema.clone()),
                ),
                ("coercer".into(), Js::Coercer(schema)),
            ])
        }
    }
}

fn handlers_to_js(items: Vec<FnHandler>, components: &Vec<Definition>) -> Js {
    Js::Array(
        items
            .into_iter()
            .map(|it| {
                let ptn = &it.pattern.open_api_pattern;
                let kind = it.pattern.method_kind.to_string().to_uppercase();
                let decoder_name = format!("[{kind}] {ptn}.response_body");
                Js::Object(vec![
                    (
                        "method_kind".into(),
                        Js::String(it.pattern.method_kind.to_string()),
                    ),
                    (
                        "params".into(),
                        Js::Array(
                            it.parameters
                                .into_iter()
                                .map(|(name, param)| {
                                    param_to_js(&name, param, &it.pattern, components)
                                })
                                .collect(),
                        ),
                    ),
                    ("pattern".into(), Js::String(it.pattern.open_api_pattern)),
                    (
                        "return_validator".into(),
                        Js::Decoder(decoder_name, it.return_type),
                    ),
                ])
            })
            .collect(),
    )
}

struct Builder;

impl Builder {
    fn export_decl(name: &str, init: Expr) -> ModuleItem {
        ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(ExportDecl {
            span: DUMMY_SP,
            decl: Decl::Var(
                VarDecl {
                    span: DUMMY_SP,
                    kind: VarDeclKind::Const,
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
                .into(),
            ),
        }))
    }
}

fn js_to_expr(
    errors: &mut Vec<Diagnostic>,
    file_name: &FileName,
    it: Js,
    components: &Vec<Definition>,
) -> Expr {
    match it {
        Js::Decoder(name, schema) => Expr::Fn(FnExpr {
            ident: None,
            function: decoder::from_schema(&schema, &name).into(),
        }),
        Js::Coercer(schema) => {
            let func = coercer::from_schema(&schema, components);
            Expr::Fn(FnExpr {
                ident: None,
                function: func.into(),
            })
        }
        Js::Null => Json::Null.to_expr(),
        Js::Bool(it) => Json::Bool(it).to_expr(),
        Js::Number(it) => Json::Number(it).to_expr(),
        Js::String(it) => Json::String(it).to_expr(),
        Js::Array(els) => Expr::Array(ArrayLit {
            span: DUMMY_SP,
            elems: els
                .into_iter()
                .map(|it| {
                    Some(ExprOrSpread {
                        spread: None,
                        expr: Box::new(js_to_expr(errors, file_name, it, components)),
                    })
                })
                .collect(),
        }),
        Js::Object(kvs) => Expr::Object(ObjectLit {
            span: DUMMY_SP,
            props: kvs
                .into_iter()
                .map(|(key, value)| {
                    PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                        key: PropName::Str(Str {
                            span: DUMMY_SP,
                            value: key.into(),
                            raw: None,
                        }),
                        value: Box::new(js_to_expr(errors, file_name, value, components)),
                    })))
                })
                .collect(),
        }),
    }
}
pub trait ToModule {
    fn to_module(self) -> (Module, Vec<Diagnostic>);
}

impl ToModule for BundleResult {
    fn to_module(mut self) -> (Module, Vec<Diagnostic>) {
        let mut body = vec![];
        for comp in &self.open_api.components {
            let name = format!("validate_{}", comp.name);
            let decoder = decoder::from_schema(&comp.schema, &comp.name);
            let module_item = ModuleItem::Stmt(Stmt::Decl(Decl::Fn(FnDecl {
                ident: Ident {
                    span: DUMMY_SP,
                    sym: name.into(),
                    optional: false,
                },
                declare: false,
                function: decoder.into(),
            })));
            body.push(module_item);
        }
        let dfs = self.open_api.components.clone();
        let meta = Builder::export_decl(
            "meta",
            js_to_expr(
                &mut self.errors,
                &self.entry_file_name,
                Js::Object(vec![
                    (
                        "handlersMeta".into(),
                        handlers_to_js(self.handlers, &self.components),
                    ),
                    ("schema".into(), self.open_api.to_json().to_js()),
                ]),
                &dfs,
            ),
        );
        body.push(meta);
        (
            Module {
                span: DUMMY_SP,
                body,
                shebang: None,
            },
            self.errors,
        )
    }
}
