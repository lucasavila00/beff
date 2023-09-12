use std::{
    collections::{BTreeMap, BTreeSet},
    rc::Rc,
};

use crate::{
    ast::{
        json::Json,
        json_schema::{JsonSchema, Optionality},
    },
    open_api_ast::Validator,
    subtyping::meterialize::MappingAcc,
};

use super::{
    bdd::Bdd,
    meterialize::{SemTypeResolverContext, TupleAcc},
    semtype::{SemType, SemTypeContext},
    subtype::{ProperSubtype, StringLitOrFormat, SubTypeTag},
};

pub enum SchemaMemo {
    Schema(JsonSchema),
    Undefined(String),
}
struct SchemerContext<'a> {
    ctx: SemTypeResolverContext<'a>,

    schemer_memo: BTreeMap<Rc<SemType>, SchemaMemo>,
    validators: Vec<Validator>,

    recursive_validators: BTreeSet<String>,

    counter: usize,
}

impl<'a> SchemerContext<'a> {
    fn new(ctx: &'a SemTypeContext) -> Self {
        Self {
            ctx: SemTypeResolverContext(ctx),
            validators: vec![],
            schemer_memo: BTreeMap::new(),
            counter: 0,
            recursive_validators: BTreeSet::new(),
        }
    }
    fn to_schema_mapping(&mut self, bdd: &Rc<Bdd>) -> JsonSchema {
        match bdd.as_ref() {
            Bdd::True => todo!(),
            Bdd::False => todo!(),
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => {
                let acc = self.ctx.materialize_mapping_node(atom, left, middle, right);
                match acc {
                    MappingAcc::Values(acc) => {
                        let acc: Vec<(String, Optionality<JsonSchema>)> = acc
                            .into_iter()
                            .map(|(k, v)| {
                                if v.has_void() {
                                    (k, self.to_schema(&v, None).optional())
                                } else {
                                    (k, self.to_schema(&v, None).required())
                                }
                            })
                            .collect();
                        JsonSchema::Object(BTreeMap::from_iter(acc))
                    }
                    MappingAcc::Unknown => todo!(),
                    MappingAcc::Never => todo!(),
                }
            }
        }
    }

    fn to_schema_list(&mut self, bdd: &Rc<Bdd>) -> JsonSchema {
        match bdd.as_ref() {
            Bdd::True => todo!(),
            Bdd::False => todo!(),
            Bdd::Node {
                atom,
                left,
                middle,
                right,
            } => {
                let ty = self
                    .ctx
                    .materialize_list_node_items(atom, left, middle, right);
                let prefixes = self
                    .ctx
                    .materialize_list_node_prefixes(atom, left, middle, right);
                match prefixes {
                    TupleAcc::Values(vs) => {
                        if vs.is_empty() {
                            return JsonSchema::Array(Box::new(self.to_schema(&ty, None)));
                        } else {
                            return JsonSchema::Tuple {
                                items: if ty.is_never() {
                                    None
                                } else {
                                    Some(Box::new(self.to_schema(&ty, None)))
                                },
                                prefix_items: vs.iter().map(|x| self.to_schema(x, None)).collect(),
                            };
                        }
                    }
                    TupleAcc::Unknown => {
                        todo!()
                    }
                    TupleAcc::Never => JsonSchema::StNever,
                }
            }
        }
    }
    fn to_schema_no_cache(&mut self, ty: &SemType) -> JsonSchema {
        if ty.all == 0 && ty.subtype_data.is_empty() {
            return JsonSchema::StNever;
        }

        let mut acc = BTreeSet::new();

        for t in SubTypeTag::all() {
            if (ty.all & t.code()) != 0 {
                match t {
                    SubTypeTag::Null => acc.insert(JsonSchema::Null),
                    SubTypeTag::Boolean => acc.insert(JsonSchema::Boolean),
                    SubTypeTag::Number => acc.insert(JsonSchema::Number),
                    SubTypeTag::String => acc.insert(JsonSchema::String),
                    SubTypeTag::Void => todo!(),
                    SubTypeTag::Mapping => unreachable!("we do not allow creation of all mappings"),
                    SubTypeTag::List => unreachable!("we do not allow creation of all arrays"),
                    SubTypeTag::Any => todo!(),
                };
            }
        }

        for s in &ty.subtype_data {
            match s.as_ref() {
                ProperSubtype::Boolean(v) => {
                    acc.insert(JsonSchema::Const(Json::Bool(*v)));
                }
                ProperSubtype::Number { allowed, values } => {
                    if !allowed {
                        todo!()
                        //     return Mater::NumberLiteral(N::parse_int(4773992856));
                    }
                    for h in values {
                        acc.insert(JsonSchema::Const(Json::Number(h.clone())));
                    }
                }
                ProperSubtype::String { allowed, values } => {
                    if !allowed {
                        todo!()
                        // return Mater::StringLiteral("Izr1mn6edP0HLrWu".into());
                    }
                    for h in values {
                        match h {
                            StringLitOrFormat::Lit(st) => {
                                acc.insert(JsonSchema::Const(Json::String(st.clone())));
                            }
                            StringLitOrFormat::Format(fmt) => {
                                acc.insert(JsonSchema::StringWithFormat(fmt.clone()));
                            }
                        }
                    }
                }
                ProperSubtype::Mapping(bdd) => {
                    acc.insert(self.to_schema_mapping(bdd));
                }
                ProperSubtype::List(bdd) => {
                    acc.insert(self.to_schema_list(bdd));
                }
            };
        }

        JsonSchema::AnyOf(acc)
    }
    pub fn to_schema(&mut self, ty: &Rc<SemType>, name: Option<&str>) -> JsonSchema {
        let new_name = match name {
            Some(n) => n.to_string(),
            None => {
                self.counter = self.counter + 1;
                format!("t_{}", self.counter)
            }
        };
        if let Some(mater) = self.schemer_memo.get(ty) {
            match mater {
                SchemaMemo::Schema(mater) => return mater.clone(),
                SchemaMemo::Undefined(ref_name) => {
                    self.recursive_validators.insert(ref_name.clone());
                    return JsonSchema::Ref(ref_name.into());
                }
            }
        } else {
            self.schemer_memo
                .insert(ty.clone(), SchemaMemo::Undefined(new_name.clone()));
        }
        let schema = self.to_schema_no_cache(ty);
        self.schemer_memo
            .insert(ty.clone(), SchemaMemo::Schema(schema.clone()));
        self.validators.push(Validator {
            name: new_name,
            schema: schema.clone(),
        });

        schema
    }
}

pub fn to_validators(ctx: &SemTypeContext, ty: &Rc<SemType>, name: &str) -> Vec<Validator> {
    let mut schemer = SchemerContext::new(ctx);
    let out = schemer.to_schema(ty, Some(name));
    let vs: Vec<Validator> = schemer
        .validators
        .into_iter()
        .filter(|it| schemer.recursive_validators.contains(&it.name))
        .chain(vec![Validator {
            name: name.into(),
            schema: out,
        }])
        .collect();

    let mut dedup: BTreeMap<String, Validator> = BTreeMap::new();

    for v in vs.into_iter() {
        dedup.insert(v.name.clone(), v);
    }

    dedup.into_iter().map(|it| it.1).collect()
}
