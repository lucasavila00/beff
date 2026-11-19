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
    // Do not look inside objects, arrays, maps and sets: they become "any object", "any array"...
    // This is enough to know the basic types of a runtype, and does not walk the type graph.
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
                // the complement of a shallow type would be too small
                RuntypeKind::StNot(_) => bail!("shallow semtype of a negation"),
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
                    let mut ty = self.convert_to_sem_type(v, builder)?;
                    if self.shallow {
                        // Keep whole basic types, so the intersection cannot lose a kind
                        // that the runtime checks of all members accept.
                        ty = SemType::new_basic(ty.basic_types()).into();
                    }
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

/// The kinds of JavaScript value, as the generated code sees them (`kindOf` in the client).
/// A set of kinds is a bit set. The bits are, in order: nullish, boolean, number, string, bigint,
/// array, object, function.
pub(crate) const JS_KIND_COUNT: usize = 8;
pub(crate) const ALL_JS_KINDS: u32 = (1 << JS_KIND_COUNT) - 1;

impl SubTypeTag {
    /// The kinds of JavaScript value that the runtime check of this basic type can accept.
    fn js_kinds(&self) -> u32 {
        match self {
            // the runtime checks all of these with `== null`
            SubTypeTag::Null | SubTypeTag::VoidUndefined | SubTypeTag::OptionalProp => 1,
            SubTypeTag::Boolean => 1 << 1,
            SubTypeTag::Number => 1 << 2,
            SubTypeTag::String => 1 << 3,
            SubTypeTag::BigInt => 1 << 4,
            SubTypeTag::List => 1 << 5,
            SubTypeTag::Mapping => 1 << 6,
            // checked with `instanceof`, which is also true for an array or a function
            // that has the class in its prototype chain
            SubTypeTag::Date | SubTypeTag::TypedArray | SubTypeTag::Map | SubTypeTag::Set => {
                1 << 5 | 1 << 6 | 1 << 7
            }
        }
    }
}

impl SemType {
    /// The basic types this type has a part of.
    fn basic_types(&self) -> u32 {
        self.all
            | self
                .subtype_data
                .iter()
                .fold(0, |acc, it| acc | it.to_code())
    }

    fn js_kinds(&self) -> u32 {
        if self.is_any() {
            return ALL_JS_KINDS;
        }
        let tags = self.basic_types();
        SubTypeTag::all()
            .into_iter()
            .filter(|tag| tags & tag.code() != 0)
            .fold(0, |acc, tag| acc | tag.js_kinds())
    }
}

impl Runtype {
    /// The kinds of JavaScript value (`ALL_JS_KINDS`) that this runtype can accept, from the basic
    /// types of its semantic type. It can include kinds that are never accepted, but it never
    /// misses one.
    pub(crate) fn js_kinds(&self, validators: &[&NamedSchema]) -> u32 {
        let mut converter = ToSemTypeConverter::new(validators);
        converter.shallow = true;
        match converter.convert_to_sem_type(self, &mut SemTypeContext::new()) {
            Ok(ty) => ty.js_kinds(),
            // not a semantic type (a function), or an alias that only refers to itself
            Err(_) => ALL_JS_KINDS,
        }
    }
}
