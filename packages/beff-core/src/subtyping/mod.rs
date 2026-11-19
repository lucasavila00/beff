use self::bdd::ListAtomic;
use self::semtype::{ComplexSemType, SemType, SemTypeContext, SemTypeOps};
use self::subtype::{StringLitOrFormat, SubTypeTag};
use crate::RuntypeUUID;
use crate::ast::runtype::{CustomFormat, Optionality, RuntypeConst, RuntypeKind};
use crate::subtyping::bdd::{IndexedPropertiesAtomic, MappingAtomicType};
use crate::subtyping::subtype::NumberRepresentationOrFormat;
use crate::{NamedSchema, ast::runtype::Runtype};
use std::collections::{BTreeMap, BTreeSet};
use std::rc::Rc;
pub(crate) mod bdd;
pub(crate) mod dnf;
pub(crate) mod mapping;
pub(crate) mod semtype;
pub(crate) mod subtype;
pub(crate) mod to_schema;
use anyhow::Result;
use anyhow::{anyhow, bail};

#[derive(PartialEq, Eq, Hash, Debug, Ord, PartialOrd, Clone, Copy)]
pub(crate) enum IsEmptyStatus {
    NotEmpty,
    IsEmpty,
}

impl IsEmptyStatus {
    #[cfg(test)]
    pub(crate) fn is_empty(&self) -> bool {
        matches!(self, IsEmptyStatus::IsEmpty)
    }
}

struct ToSemTypeConverter<'a> {
    validators: &'a [&'a NamedSchema],
    seen_refs: BTreeSet<RuntypeUUID>,
    // When true, the converter does not look inside objects, arrays, maps and sets.
    // It converts each of them to "any object", "any array", "any map" or "any set".
    // `Runtype::js_value_kinds` uses this mode. It must know only if a runtype accepts some
    // object or some array, not which ones. In this mode the converter does not follow the
    // references inside an object or an array, so a long chain of types does not make it slow.
    shallow: bool,
}

impl<'a> ToSemTypeConverter<'a> {
    fn new(validators: &'a [&'a NamedSchema]) -> Self {
        Self {
            validators,
            seen_refs: BTreeSet::new(),
            shallow: false,
        }
    }

    fn get_reference(&self, name: &RuntypeUUID) -> Result<&Runtype> {
        for validator in self.validators {
            if &validator.name == name {
                return Ok(&validator.schema);
            }
        }
        Err(anyhow!("reference not found: {}", name.diag_print()))
    }

    fn convert_to_sem_type(
        &mut self,
        schema: &Runtype,
        builder: &mut SemTypeContext,
    ) -> Result<Rc<SemType>> {
        if self.shallow {
            let target = match &schema.kind {
                RuntypeKind::Ref(name) => self.get_reference(name)?,
                _ => schema,
            };
            let tag = match &target.kind {
                RuntypeKind::Object { .. } => Some(SubTypeTag::Mapping),
                RuntypeKind::Array(_) | RuntypeKind::Tuple { .. } | RuntypeKind::AnyArrayLike => {
                    Some(SubTypeTag::List)
                }
                RuntypeKind::Map(..) => Some(SubTypeTag::Map),
                RuntypeKind::Set(_) => Some(SubTypeTag::Set),
                // In this mode a type is converted to a larger type ("any object"). The negation
                // of a larger type is too small, so it could miss a kind. Fail here.
                // `js_value_kinds` then returns all kinds.
                RuntypeKind::StNot(_) => bail!("cannot find the kinds of a negation"),
                // `js_value_kinds` handles an intersection before it calls the converter.
                // Fail for an intersection in a different position. `js_value_kinds` then
                // returns all kinds.
                RuntypeKind::AllOf(_) => bail!("cannot find the kinds of a nested intersection"),
                _ => None,
            };
            if let Some(tag) = tag {
                return Ok(SemType::new_basic(tag.code()).into());
            }
        }
        match &schema.kind {
            RuntypeKind::Ref(name) => {
                let schema = self.get_reference(name)?.clone();

                // handle recursive types
                if let RuntypeKind::Tuple {
                    prefix_items,
                    items,
                } = &schema.kind
                {
                    match builder.list_runtype_ref_memo.get(name) {
                        Some(idx) => {
                            let ty = Rc::new(SemTypeContext::mapping_definition_from_idx(*idx));
                            return Ok(ty);
                        }
                        None => {
                            let idx = builder.list_definitions.len();
                            builder.list_runtype_ref_memo.insert(name.clone(), idx);
                            builder.list_definitions.push(None);

                            let items = match items {
                                Some(items) => Some(self.convert_to_sem_type(items, builder)?),
                                None => None,
                            };
                            let prefix_items: Vec<Rc<ComplexSemType>> = prefix_items
                                .iter()
                                .map(|v| self.convert_to_sem_type(v, builder))
                                .collect::<Result<_>>()?;

                            builder.list_definitions[idx] = Some(Rc::new(ListAtomic {
                                prefix_items,
                                // todo: should be unknown?
                                items: items.unwrap_or(SemTypeContext::never().into()),
                            }));

                            let ty = Rc::new(SemTypeContext::list_definition_from_idx(idx));

                            return Ok(ty);
                        }
                    }
                }
                // handle recursive types
                if let RuntypeKind::Object {
                    vs,
                    indexed_properties,
                } = &schema.kind
                {
                    match builder.mapping_runtype_ref_memo.get(name) {
                        Some(idx) => {
                            let ty = Rc::new(SemTypeContext::mapping_definition_from_idx(*idx));
                            return Ok(ty);
                        }
                        None => {
                            let idx = builder.mapping_definitions.len();
                            builder.mapping_runtype_ref_memo.insert(name.clone(), idx);
                            builder.mapping_definitions.push(None);
                            let vs: BTreeMap<String, Rc<SemType>> = vs
                                .iter()
                                .map(|(k, v)| match v {
                                    Optionality::Optional(v) => {
                                        self.convert_to_sem_type(v, builder).and_then(|v| {
                                            SemTypeContext::make_optional(v).map(|v| (k.clone(), v))
                                        })
                                    }
                                    Optionality::Required(v) => {
                                        self.convert_to_sem_type(v, builder).map(|v| (k.clone(), v))
                                    }
                                })
                                .collect::<Result<_>>()?;
                            let mut indexed_props_acc = None;
                            if let Some(it) = indexed_properties {
                                let v = match &it.value {
                                    Optionality::Optional(v) => self
                                        .convert_to_sem_type(v, builder)
                                        .and_then(SemTypeContext::make_optional)?,
                                    Optionality::Required(v) => {
                                        self.convert_to_sem_type(v, builder)?
                                    }
                                };
                                let k = self.convert_to_sem_type(&it.key, builder)?;
                                let t = IndexedPropertiesAtomic { key: k, value: v };
                                indexed_props_acc = Some(t);
                            }

                            builder.mapping_definitions[idx] = Some(Rc::new(MappingAtomicType {
                                vs,
                                indexed_properties: indexed_props_acc,
                            }));
                            let ty = Rc::new(SemTypeContext::mapping_definition_from_idx(idx));
                            return Ok(ty);
                        }
                    }
                };

                // handle recursive types
                if let RuntypeKind::Map(k, v) = &schema.kind {
                    match builder.map_runtype_ref_memo.get(name) {
                        Some(idx) => {
                            let ty = Rc::new(SemTypeContext::map_definition_from_idx(*idx));
                            return Ok(ty);
                        }
                        None => {
                            let idx = builder.map_definitions.len();
                            builder.map_runtype_ref_memo.insert(name.clone(), idx);
                            builder.map_definitions.push(None);
                            let k = self.convert_to_sem_type(k, builder)?;
                            let v = self.convert_to_sem_type(v, builder)?;

                            builder.map_definitions[idx] = Some(Rc::new(MappingAtomicType {
                                vs: BTreeMap::new(),
                                indexed_properties: Some(IndexedPropertiesAtomic {
                                    key: k,
                                    value: v,
                                }),
                            }));
                            let ty = Rc::new(SemTypeContext::map_definition_from_idx(idx));
                            return Ok(ty);
                        }
                    }
                }

                // handle recursive types
                if let RuntypeKind::Set(v) = &schema.kind {
                    match builder.set_runtype_ref_memo.get(name) {
                        Some(idx) => {
                            let ty = Rc::new(SemTypeContext::set_definition_from_idx(*idx));
                            return Ok(ty);
                        }
                        None => {
                            let idx = builder.set_definitions.len();
                            builder.set_runtype_ref_memo.insert(name.clone(), idx);
                            builder.set_definitions.push(None);
                            let v = self.convert_to_sem_type(v, builder)?;

                            builder.set_definitions[idx] = Some(Rc::new(ListAtomic {
                                prefix_items: vec![],
                                items: v,
                            }));
                            let ty = Rc::new(SemTypeContext::set_definition_from_idx(idx));
                            return Ok(ty);
                        }
                    }
                }

                if self.seen_refs.contains(name) {
                    bail!("recursive type: {}", name.diag_print())
                }

                self.seen_refs.insert(name.clone());
                let ty = self.convert_to_sem_type(&schema, builder);
                self.seen_refs.remove(name);
                Ok(ty?)
            }
            RuntypeKind::AnyOf(vs) => {
                let mut acc = Rc::new(SemTypeContext::never());
                for v in vs {
                    acc = acc.union(&self.convert_to_sem_type(v, builder)?)?;
                }
                Ok(acc)
            }
            RuntypeKind::AllOf(vs) => {
                let mut acc = Rc::new(SemTypeContext::unknown());
                for v in vs {
                    let ty = self.convert_to_sem_type(v, builder)?;
                    acc = acc.intersect(&ty)?;
                }
                Ok(acc)
            }
            RuntypeKind::Null => Ok(SemTypeContext::null().into()),
            RuntypeKind::Boolean => Ok(SemTypeContext::boolean().into()),
            RuntypeKind::String => Ok(SemTypeContext::string().into()),
            RuntypeKind::Number => Ok(SemTypeContext::number().into()),
            RuntypeKind::Any => Ok(SemTypeContext::unknown().into()),
            RuntypeKind::StringWithFormat(CustomFormat(first, rest)) => Ok(
                SemTypeContext::string_const(StringLitOrFormat::Format(CustomFormat(
                    first.clone(),
                    rest.clone(),
                )))
                .into(),
            ),
            RuntypeKind::NumberWithFormat(CustomFormat(first, rest)) => Ok(
                SemTypeContext::number_const(NumberRepresentationOrFormat::Format(CustomFormat(
                    first.clone(),
                    rest.clone(),
                )))
                .into(),
            ),
            RuntypeKind::TplLitType(tpl) => {
                Ok(SemTypeContext::string_const(StringLitOrFormat::Tpl(tpl.clone())).into())
            }
            RuntypeKind::Object {
                vs,
                indexed_properties,
            } => {
                let vs = vs
                    .iter()
                    .map(|(k, v)| match v {
                        Optionality::Optional(v) => self
                            .convert_to_sem_type(v, builder)
                            .and_then(|v| SemTypeContext::make_optional(v).map(|v| (k.clone(), v))),
                        Optionality::Required(v) => {
                            self.convert_to_sem_type(v, builder).map(|v| (k.clone(), v))
                        }
                    })
                    .collect::<Result<_>>()?;
                let mut indexed_props_acc = None;
                if let Some(it) = indexed_properties {
                    let v = match &it.value {
                        Optionality::Optional(v) => self
                            .convert_to_sem_type(v, builder)
                            .and_then(SemTypeContext::make_optional)?,
                        Optionality::Required(v) => self.convert_to_sem_type(v, builder)?,
                    };
                    let k = self.convert_to_sem_type(&it.key, builder)?;
                    let t = IndexedPropertiesAtomic { key: k, value: v };
                    indexed_props_acc = Some(t);
                }

                Ok(builder.mapping_definition(vs, indexed_props_acc).into())
            }
            RuntypeKind::Array(items) => {
                let items = self.convert_to_sem_type(items, builder)?;
                Ok(builder.array(items).into())
            }
            RuntypeKind::Tuple {
                prefix_items,
                items,
            } => {
                let items = match items {
                    Some(items) => Some(self.convert_to_sem_type(items, builder)?),
                    None => None,
                };
                let prefix_items: Vec<Rc<ComplexSemType>> = prefix_items
                    .iter()
                    .map(|v| self.convert_to_sem_type(v, builder))
                    .collect::<Result<_>>()?;
                Ok(builder.tuple(prefix_items, items).into())
            }
            RuntypeKind::Map(k, v) => {
                let k = self.convert_to_sem_type(k, builder)?;
                let v = self.convert_to_sem_type(v, builder)?;
                Ok(builder.map(k, v).into())
            }
            RuntypeKind::Set(v) => {
                let v = self.convert_to_sem_type(v, builder)?;
                Ok(builder.set(v).into())
            }
            RuntypeKind::Const(cons) => match cons {
                RuntypeConst::Bool(b) => Ok(SemTypeContext::boolean_const(*b).into()),
                RuntypeConst::Number(n) => Ok(SemTypeContext::number_const(
                    NumberRepresentationOrFormat::Lit(n.clone()),
                )
                .into()),
            },
            RuntypeKind::AnyArrayLike => {
                self.convert_to_sem_type(&Runtype::array(Runtype::any().into()), builder)
            }
            RuntypeKind::Date => Ok(SemTypeContext::date().into()),
            RuntypeKind::BigInt => Ok(SemTypeContext::bigint().into()),
            RuntypeKind::TypedArray(kind) => Ok(SemTypeContext::typed_array(*kind).into()),
            RuntypeKind::Never => Ok(SemTypeContext::never().into()),
            RuntypeKind::StNot(it) => {
                let chd = self.convert_to_sem_type(it, builder)?;
                Ok(chd.complement()?)
            }
            RuntypeKind::Function => {
                bail!("function runtype cannot be converted to semtype")
            }
            RuntypeKind::Undefined => Ok(SemTypeContext::undefined().into()),
            RuntypeKind::Void => Ok(SemTypeContext::void().into()),
        }
    }
}

pub(crate) trait ToSemType {
    fn to_sem_type(
        &self,
        validators: &[&NamedSchema],
        ctx: &mut SemTypeContext,
    ) -> Result<Rc<SemType>>;
}

impl ToSemType for Runtype {
    fn to_sem_type(
        &self,
        validators: &[&NamedSchema],
        ctx: &mut SemTypeContext,
    ) -> Result<Rc<SemType>> {
        ToSemTypeConverter::new(validators).convert_to_sem_type(self, ctx)
    }
}

/// A kind of JavaScript value. Each value has one kind, or no kind (a symbol).
/// The generated code finds the kind of an input with `valueKindIndexOf`, in
/// `packages/beff-client/src/codegen-v2.ts`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub(crate) enum JsValueKind {
    /// null or undefined
    Nullish,
    Boolean,
    Number,
    String,
    BigInt,
    Array,
    /// An object that is not an array and not a function.
    Object,
    Function,
}

impl JsValueKind {
    pub(crate) const ALL: [JsValueKind; 8] = [
        JsValueKind::Nullish,
        JsValueKind::Boolean,
        JsValueKind::Number,
        JsValueKind::String,
        JsValueKind::BigInt,
        JsValueKind::Array,
        JsValueKind::Object,
        JsValueKind::Function,
    ];

    /// The name of the kind in the generated code. The runtime has the same names in
    /// `VALUE_KINDS` (codegen-v2.ts).
    pub(crate) fn name(&self) -> &'static str {
        match self {
            JsValueKind::Nullish => "nullish",
            JsValueKind::Boolean => "boolean",
            JsValueKind::Number => "number",
            JsValueKind::String => "string",
            JsValueKind::BigInt => "bigint",
            JsValueKind::Array => "array",
            JsValueKind::Object => "object",
            JsValueKind::Function => "function",
        }
    }
}

impl SubTypeTag {
    /// Returns the kinds of value that the runtime check for this basic type can accept.
    fn js_value_kinds(&self) -> &'static [JsValueKind] {
        match self {
            // The runtime checks these three with `== null`, so each accepts null and undefined.
            SubTypeTag::Null | SubTypeTag::VoidUndefined | SubTypeTag::OptionalProp => {
                &[JsValueKind::Nullish]
            }
            SubTypeTag::Boolean => &[JsValueKind::Boolean],
            SubTypeTag::Number => &[JsValueKind::Number],
            SubTypeTag::String => &[JsValueKind::String],
            SubTypeTag::BigInt => &[JsValueKind::BigInt],
            SubTypeTag::List => &[JsValueKind::Array],
            SubTypeTag::Mapping => &[JsValueKind::Object],
            // The runtime checks these with `instanceof`. `instanceof` is also true for an array
            // or a function that has the class in its prototype chain.
            SubTypeTag::Date | SubTypeTag::TypedArray | SubTypeTag::Map | SubTypeTag::Set => &[
                JsValueKind::Array,
                JsValueKind::Object,
                JsValueKind::Function,
            ],
        }
    }
}

impl SemType {
    /// Returns the kinds of value that this type can accept.
    /// A `SemType` sorts its values by `SubTypeTag` (string, number, list, ...). `all` has the
    /// tags of which the type accepts all values. `subtype_data` has the tags of which the type
    /// accepts some values. The result has the kinds of the tags in the two groups.
    fn js_value_kinds(&self) -> BTreeSet<JsValueKind> {
        if self.is_any() {
            return JsValueKind::ALL.into_iter().collect();
        }
        let tag_codes = self
            .subtype_data
            .iter()
            .fold(self.all, |acc, it| acc | it.to_code());
        SubTypeTag::all()
            .into_iter()
            .filter(|tag| tag_codes & tag.code() != 0)
            .flat_map(|tag| tag.js_value_kinds().iter().copied())
            .collect()
    }
}

impl Runtype {
    /// Returns the kinds of JavaScript value that this runtype can accept.
    /// The set can include a kind that the runtype never accepts. It never misses a kind that the
    /// runtype accepts. Thus, when a kind is not in the set, the runtype rejects all values of
    /// that kind.
    pub(crate) fn js_value_kinds(&self, validators: &[&NamedSchema]) -> BTreeSet<JsValueKind> {
        self.js_value_kinds_with_refs(validators, &mut BTreeSet::new())
    }

    /// `refs_on_path` has the named types that the function is in at this time. It stops a loop
    /// on a type that refers to itself.
    fn js_value_kinds_with_refs<'a>(
        &'a self,
        validators: &[&'a NamedSchema],
        refs_on_path: &mut BTreeSet<&'a RuntypeUUID>,
    ) -> BTreeSet<JsValueKind> {
        let all_kinds = || JsValueKind::ALL.into_iter().collect::<BTreeSet<_>>();
        match &self.kind {
            RuntypeKind::Ref(name) => {
                let target = validators.iter().find(|it| &it.name == name);
                match target {
                    Some(target) if refs_on_path.insert(name) => {
                        let kinds = target
                            .schema
                            .js_value_kinds_with_refs(validators, refs_on_path);
                        refs_on_path.remove(name);
                        kinds
                    }
                    // The name is not known, or the type refers to itself without an object or
                    // an array between. The safe result is all kinds.
                    _ => all_kinds(),
                }
            }
            // A union accepts a kind if one member accepts it.
            RuntypeKind::AnyOf(members) => members
                .iter()
                .flat_map(|it| it.js_value_kinds_with_refs(validators, refs_on_path))
                .collect(),
            // An intersection accepts a value only if all members accept it. Thus it can accept
            // a kind only if all members can accept that kind.
            // Example: `Date & { foo: string }`. The runtime check of `Date` accepts the kinds
            // array, object and function. The check of `{ foo: string }` accepts the kind object.
            // The intersection accepts the kind object.
            RuntypeKind::AllOf(members) => members
                .iter()
                .map(|it| it.js_value_kinds_with_refs(validators, refs_on_path))
                .fold(all_kinds(), |acc, kinds| {
                    acc.intersection(&kinds).copied().collect()
                }),
            // All other runtypes: convert the runtype to a `SemType`, the form of a type that the
            // subtype checker uses, and read the kinds from it.
            _ => {
                let mut converter = ToSemTypeConverter::new(validators);
                converter.shallow = true;
                match converter.convert_to_sem_type(self, &mut SemTypeContext::new()) {
                    Ok(ty) => ty.js_value_kinds(),
                    // The conversion fails for a type that the subtype checker cannot show (a
                    // function, a negation). The safe result is all kinds.
                    Err(_) => all_kinds(),
                }
            }
        }
    }
}
