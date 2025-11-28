use crate::ast::runtype::{TplLitType, TplLitTypeItem};
use crate::subtyping::dnf::Dnf;
use crate::subtyping::subtype::{ProperSubtype, StringLitOrFormat, SubTypeTag};
use crate::subtyping::IsEmptyStatus;
use crate::subtyping::{
    bdd::{Atom, IndexedPropertiesAtomic, MappingAtomicType},
    semtype::{SemType, SemTypeContext, SemTypeOps},
};
use anyhow::{bail, Result};
use std::collections::BTreeSet;
use std::rc::Rc;

pub fn intersect_mapping(
    m1: Rc<MappingAtomicType>,
    m2: Rc<MappingAtomicType>,
    ctx: &mut SemTypeContext,
) -> Result<Option<Rc<MappingAtomicType>>> {
    let m1_names = BTreeSet::from_iter(m1.vs.keys());
    let m2_names = BTreeSet::from_iter(m2.vs.keys());
    let all_names = m1_names.union(&m2_names).collect::<BTreeSet<_>>();
    let mut acc = vec![];
    for name in all_names {
        let type1 = m1
            .vs
            .get(*name)
            .cloned()
            .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));
        let type2 = m2
            .vs
            .get(*name)
            .cloned()
            .unwrap_or_else(|| Rc::new(SemTypeContext::unknown()));
        let t = type1.intersect(&type2)?;
        if t.is_never() {
            return Ok(None);
        }
        acc.push((name.to_string(), t))
    }

    let mut indexed_properties_acc = None;

    match (&m1.indexed_properties, &m2.indexed_properties) {
        (Some(p1), Some(p2)) => {
            let keys_are_same_type = p1.key.is_same_type(&p2.key, ctx)?;
            if !keys_are_same_type {
                bail!("intersection of indexed properties of different key types is not supported");
            }
            indexed_properties_acc = Some(IndexedPropertiesAtomic {
                key: p1.key.clone(),
                value: p1.value.intersect(&p2.value)?,
            });
        }
        (None, Some(p)) | (Some(p), None) => {
            indexed_properties_acc = Some(p.clone());
        }
        (None, None) => {}
    }

    Ok(Some(Rc::new(MappingAtomicType {
        vs: acc.into_iter().collect(),
        indexed_properties: indexed_properties_acc,
    })))
}

fn is_finite_tpl_item(item: &TplLitTypeItem) -> bool {
    match item {
        TplLitTypeItem::StringConst(_) => true,
        TplLitTypeItem::OneOf(items) => items.iter().all(is_finite_tpl_item),
        _ => false,
    }
}

fn is_finite_string_set(ty: &Rc<SemType>) -> bool {
    if (ty.all & SubTypeTag::String.code()) != 0 {
        return false;
    }

    for subtype in &ty.subtype_data {
        if let ProperSubtype::String { allowed, values } = subtype.as_ref() {
            if !allowed {
                return false;
            }
            for val in values {
                match val {
                    StringLitOrFormat::Format(_) => return false,
                    StringLitOrFormat::Tpl(tpl) => {
                        for item in &tpl.0 {
                            if !is_finite_tpl_item(item) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
    }
    true
}
fn extract_keys_from_tpl_item(item: &TplLitTypeItem, acc: &mut Vec<String>) {
    match item {
        TplLitTypeItem::StringConst(s) => acc.push(s.clone()),
        TplLitTypeItem::OneOf(items) => {
            for it in items {
                extract_keys_from_tpl_item(it, acc);
            }
        }
        _ => {}
    }
}

fn extract_keys_from_type(ty: &Rc<SemType>) -> Vec<String> {
    let mut keys = vec![];
    for subtype in &ty.subtype_data {
        if let ProperSubtype::String { allowed, values } = subtype.as_ref() {
            if *allowed {
                for val in values {
                    if let StringLitOrFormat::Tpl(tpl) = val {
                        if tpl.0.len() == 1 {
                            extract_keys_from_tpl_item(&tpl.0[0], &mut keys);
                        }
                    }
                }
            }
        }
    }
    keys
}
enum IntersectionResult {
    Empty,
    Atomic(Rc<MappingAtomicType>),
}

fn non_empty_map_literals_intersection(
    pos: &[Atom],
    ctx: &mut SemTypeContext,
) -> Result<IntersectionResult> {
    let mut acc = Rc::new(MappingAtomicType::new());

    for atom in pos {
        let atom_type = match atom {
            Atom::Mapping(a) => ctx.get_mapping_atomic(*a),
            _ => unreachable!(),
        };

        match intersect_mapping(acc, atom_type, ctx)? {
            Some(v) => acc = v,
            None => return Ok(IntersectionResult::Empty),
        }
    }
    Ok(IntersectionResult::Atomic(acc))
}

fn mapping_atomic_type_is_empty(
    atom: Rc<MappingAtomicType>,
    neg: &[Atom],
    ctx: &mut SemTypeContext,
) -> Result<bool> {
    let mut neg_mappings = vec![];
    for n in neg {
        if let Atom::Mapping(idx) = n {
            neg_mappings.push(ctx.get_mapping_atomic(*idx).clone());
        }
    }

    check_mapping_empty(atom, &neg_mappings, ctx)
}

fn get_value_exact(
    m: &MappingAtomicType,
    k: &str,
    ctx: &mut SemTypeContext,
) -> Result<Rc<SemType>> {
    if let Some(v) = m.vs.get(k) {
        return Ok(v.clone());
    }

    if let Some(idx) = &m.indexed_properties {
        let k_type = Rc::new(SemTypeContext::string_const(StringLitOrFormat::Tpl(
            TplLitType(vec![TplLitTypeItem::StringConst(k.to_string())]),
        )));

        if k_type.is_subtype(&idx.key, ctx)? {
            if is_finite_string_set(&idx.key) {
                return Ok(idx.value.clone());
            } else {
                return SemTypeContext::make_optional(idx.value.clone());
            }
        }
    }

    Ok(Rc::new(SemTypeContext::optional_prop()))
}

fn get_value_open(m: &MappingAtomicType, k: &str, ctx: &mut SemTypeContext) -> Result<Rc<SemType>> {
    if let Some(v) = m.vs.get(k) {
        return Ok(v.clone());
    }

    if let Some(idx) = &m.indexed_properties {
        let k_type = Rc::new(SemTypeContext::string_const(StringLitOrFormat::Tpl(
            TplLitType(vec![TplLitTypeItem::StringConst(k.to_string())]),
        )));

        if k_type.is_subtype(&idx.key, ctx)? {
            if is_finite_string_set(&idx.key) {
                return Ok(idx.value.clone());
            } else {
                return SemTypeContext::make_optional(idx.value.clone());
            }
        }
    }

    Ok(Rc::new(SemTypeContext::unknown()))
}

fn get_index_value_exact(m: &MappingAtomicType) -> Rc<SemType> {
    if let Some(idx) = &m.indexed_properties {
        idx.value.clone()
    } else {
        Rc::new(SemTypeContext::optional_prop())
    }
}

fn get_index_value_open(m: &MappingAtomicType) -> Rc<SemType> {
    if let Some(idx) = &m.indexed_properties {
        idx.value.clone()
    } else {
        Rc::new(SemTypeContext::unknown())
    }
}

fn get_key_type_exact(m: &MappingAtomicType) -> Rc<SemType> {
    if let Some(idx) = &m.indexed_properties {
        idx.key.clone()
    } else {
        Rc::new(SemTypeContext::never())
    }
}

fn get_key_type_open(m: &MappingAtomicType) -> Rc<SemType> {
    if let Some(idx) = &m.indexed_properties {
        idx.key.clone()
    } else {
        Rc::new(SemTypeContext::string())
    }
}

fn get_effective_index_value(
    pos: &MappingAtomicType,
    neg: &MappingAtomicType,
    ctx: &mut SemTypeContext,
) -> Result<Rc<SemType>> {
    let pos_key = get_key_type_exact(pos);
    let neg_key = get_key_type_open(neg);

    if pos_key.is_subtype(&neg_key, ctx)? {
        let val = get_index_value_open(neg);
        SemTypeContext::make_optional(val)
    } else {
        Ok(Rc::new(SemTypeContext::unknown()))
    }
}

fn check_mapping_empty(
    pos: Rc<MappingAtomicType>,
    negs: &[Rc<MappingAtomicType>],
    ctx: &mut SemTypeContext,
) -> Result<bool> {
    // 1. Check if pos is empty (any field is empty)
    for v in pos.vs.values() {
        if v.is_empty(ctx)? {
            return Ok(true);
        }
    }
    if let Some(idx) = &pos.indexed_properties {
        if idx.key.is_empty(ctx)? {
            return Ok(true);
        }
        if idx.value.is_empty(ctx)? {
            return Ok(true);
        }
    }

    // 2. If no negs, not empty (unless pos is empty, checked above)
    if negs.is_empty() {
        return Ok(false);
    }

    let current_neg = &negs[0];
    let rest_negs = &negs[1..];

    // 3. Collect all keys
    let mut all_keys = BTreeSet::new();
    for k in pos.vs.keys() {
        all_keys.insert(k.clone());
    }
    for k in current_neg.vs.keys() {
        all_keys.insert(k.clone());
    }

    // Add keys from finite index signatures in neg
    if let Some(idx) = &current_neg.indexed_properties {
        if is_finite_string_set(&idx.key) {
            let keys = extract_keys_from_type(&idx.key);
            for k in keys {
                all_keys.insert(k);
            }
        }
    }

    // 4. Check each key dimension
    for k in all_keys {
        let v_p = get_value_exact(&pos, &k, ctx)?;
        let v_n = get_value_open(current_neg, &k, ctx)?;

        let diff = v_p.diff(&v_n)?;
        if !diff.is_empty(ctx)? {
            let mut new_pos = (*pos).clone();
            new_pos.vs.insert(k, diff);
            if !check_mapping_empty(Rc::new(new_pos), rest_negs, ctx)? {
                return Ok(false);
            }
        }
    }

    // 5. Check index signature dimension
    let v_p_idx = get_index_value_exact(&pos);
    let v_n_idx = get_effective_index_value(&pos, current_neg, ctx)?;

    let diff_idx = v_p_idx.diff(&v_n_idx)?;
    if !diff_idx.is_empty(ctx)? {
        let mut new_pos = (*pos).clone();
        // Update indexed_properties value
        // We need to preserve the key type of pos
        let key_type = if let Some(idx) = &pos.indexed_properties {
            idx.key.clone()
        } else {
            Rc::new(SemTypeContext::unknown())
        };

        new_pos.indexed_properties = Some(IndexedPropertiesAtomic {
            key: key_type,
            value: diff_idx,
        });

        if !check_mapping_empty(Rc::new(new_pos), rest_negs, ctx)? {
            return Ok(false);
        }
    }

    Ok(true)
}

pub fn mapping_is_empty_impl(dnf: Rc<Dnf>, ctx: &mut SemTypeContext) -> Result<IsEmptyStatus> {
    let mut acc = vec![];
    for it in dnf.as_ref() {
        match non_empty_map_literals_intersection(&it.positive, ctx)? {
            IntersectionResult::Empty => acc.push(true),
            IntersectionResult::Atomic(a) => {
                let res = mapping_atomic_type_is_empty(a, &it.negative, ctx)?;
                acc.push(res);
            }
        }
    }
    let is_empty = acc.iter().all(|x| *x);

    Ok(if is_empty {
        IsEmptyStatus::IsEmpty
    } else {
        IsEmptyStatus::NotEmpty
    })
}
#[cfg(test)]
mod tests {
    use crate::subtyping::{bdd::MappingAtomicType, dnf::Conjunction};

    use super::*;

    #[test]
    fn test_dnd_mapping_empty_trivial() {
        let st_string = Rc::new(SemTypeContext::string());

        let mut ctx = SemTypeContext::new();

        let idx = ctx.mapping_definitions.len();
        ctx.mapping_definitions.push(Some(
            MappingAtomicType {
                vs: vec![("a".to_string(), st_string.into())]
                    .into_iter()
                    .collect(),
                indexed_properties: None,
            }
            .into(),
        ));

        // This would be: A & ~A, which is obviously not inhabited
        let trivial_dnf = vec![Conjunction {
            positive: vec![Atom::Mapping(idx)],
            negative: vec![Atom::Mapping(idx)],
        }];

        let result = mapping_is_empty_impl(trivial_dnf.into(), &mut ctx).unwrap();

        assert!(result.is_empty());
    }
}
