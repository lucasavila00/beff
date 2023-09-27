use crate::{
    api_extractor::{FnHandler, HandlerParameter, PathHandlerMap, RouterExtractResult},
    ast::json_schema::{JsonSchema, Optionality},
    open_api_ast::Validator,
    parser_extractor::ParserExtractResult,
    subtyping::{semtype::SemTypeContext, to_schema::to_validators, ToSemType},
    ExtractResult,
};

pub trait SimplifySchema {
    fn simplify(self, ctx: &mut SemTypeContext) -> Self;
}
impl SimplifySchema for HandlerParameter {
    fn simplify(self, ctx: &mut SemTypeContext) -> Self {
        match self {
            HandlerParameter::PathOrQueryOrBody {
                schema,
                required,
                description,
                span,
            } => HandlerParameter::PathOrQueryOrBody {
                schema: schema.simplify(ctx),
                required: required,
                description: description,
                span: span,
            },
            HandlerParameter::Header {
                span,
                schema,
                required,
                description,
            } => HandlerParameter::Header {
                span,
                schema: schema.simplify(ctx),
                required,
                description,
            },
            HandlerParameter::Context(_) => self,
        }
    }
}
impl SimplifySchema for FnHandler {
    fn simplify(mut self, ctx: &mut SemTypeContext) -> Self {
        self.parameters = self
            .parameters
            .into_iter()
            .map(|(k, it)| (k, it.simplify(ctx)))
            .collect();
        self
    }
}
impl SimplifySchema for PathHandlerMap {
    fn simplify(mut self, ctx: &mut SemTypeContext) -> Self {
        self.handlers = self
            .handlers
            .into_iter()
            .map(|it| it.simplify(ctx))
            .collect();
        self
    }
}
impl SimplifySchema for RouterExtractResult {
    fn simplify(mut self, ctx: &mut SemTypeContext) -> Self {
        let validators: Vec<Validator> = self
            .validators
            .into_iter()
            .map(|it| it.simplify(ctx))
            .collect();

        self.validators = validators;
        let routes: Vec<PathHandlerMap> =
            self.routes.into_iter().map(|it| it.simplify(ctx)).collect();
        self.routes = routes;
        self
    }
}

fn simplify_with_sem_types(obj: JsonSchema, ctx: &mut SemTypeContext) -> JsonSchema {
    let validators = vec![];
    let obj_st = obj.to_sem_type(&validators, ctx).unwrap();
    let (it, rest) = to_validators(ctx, &obj_st, "anything...");
    assert!(rest.is_empty());
    it.schema
}

fn maybe_simplify_with_sem_types(it: &JsonSchema, ctx: &mut SemTypeContext) -> Option<JsonSchema> {
    match it {
        JsonSchema::Ref(_) | JsonSchema::OpenApiResponseRef(_) => None,
        JsonSchema::StringWithFormat(_)
        | JsonSchema::StNever
        | JsonSchema::StUnknown
        | JsonSchema::AnyObject
        | JsonSchema::AnyArrayLike
        | JsonSchema::Any
        | JsonSchema::Boolean
        | JsonSchema::String
        | JsonSchema::Number
        | JsonSchema::Const(_)
        | JsonSchema::Codec(_)
        | JsonSchema::Null => Some(it.clone()),
        JsonSchema::Object(vs) => {
            Some(JsonSchema::object(
                vs.into_iter()
                    .map(|(k, v)| match v {
                        Optionality::Optional(v) => maybe_simplify_with_sem_types(v, ctx)
                            .map(|it| (k.clone(), it.optional())),
                        Optionality::Required(v) => maybe_simplify_with_sem_types(v, ctx)
                            .map(|it| (k.clone(), it.required())),
                    })
                    .collect::<Option<Vec<_>>>()?
                    .into(),
            ))
        }
        JsonSchema::Array(v) => Some(JsonSchema::Array(
            maybe_simplify_with_sem_types(v, ctx)?.into(),
        )),
        JsonSchema::Tuple {
            prefix_items,
            items,
        } => {
            let prefix_items = prefix_items
                .into_iter()
                .map(|it| maybe_simplify_with_sem_types(it, ctx))
                .collect::<Option<_>>()?;
            let items = match items {
                Some(it) => Some(maybe_simplify_with_sem_types(it, ctx)?.into()),
                None => None,
            };
            Some(JsonSchema::Tuple {
                prefix_items,
                items,
            })
        }
        JsonSchema::StNot(v) => Some(JsonSchema::StNot(
            maybe_simplify_with_sem_types(v, ctx)?.into(),
        )),
        JsonSchema::AnyOf(vs) => {
            let simple_vs = vs
                .into_iter()
                .map(|it| maybe_simplify_with_sem_types(it, ctx))
                .collect::<Option<Vec<_>>>()?;
            let any_of = JsonSchema::any_of(simple_vs);
            return Some(simplify_with_sem_types(any_of, ctx));
        }
        JsonSchema::AllOf(vs) => {
            let simple_vs = vs
                .into_iter()
                .map(|it| maybe_simplify_with_sem_types(it, ctx))
                .collect::<Option<Vec<_>>>()?;
            let any_of = JsonSchema::all_of(simple_vs);
            return Some(simplify_with_sem_types(any_of, ctx));
        }
    }
}
impl SimplifySchema for JsonSchema {
    fn simplify(self, ctx: &mut SemTypeContext) -> Self {
        match maybe_simplify_with_sem_types(&self, ctx) {
            Some(simple) => simple,
            None => self,
        }
    }
}
impl SimplifySchema for Validator {
    fn simplify(mut self, ctx: &mut SemTypeContext) -> Self {
        self.schema = self.schema.simplify(ctx);
        self
    }
}
impl SimplifySchema for ParserExtractResult {
    fn simplify(mut self, ctx: &mut SemTypeContext) -> ParserExtractResult {
        let validators = self
            .validators
            .into_iter()
            .map(|it| it.simplify(ctx))
            .collect();
        self.validators = validators;
        self
    }
}
impl SimplifySchema for ExtractResult {
    fn simplify(mut self, ctx: &mut SemTypeContext) -> ExtractResult {
        if let Some(router) = self.router {
            self.router = Some(router.simplify(ctx));
        }
        if let Some(parser) = self.parser {
            self.parser = Some(parser.simplify(ctx));
        }
        self
    }
}
