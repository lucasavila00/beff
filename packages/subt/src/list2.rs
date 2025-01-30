use crate::{
    cf::CF,
    sub::{vec_union, Ty},
};

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ListKV {
    prefix_items: Vec<Ty>,
}

impl ListKV {
    fn to_cf(&self, tag: &ListTag) -> CF {
        if self.prefix_items.is_empty() && tag == &ListTag::Open {
            CF::ListTop
        } else {
            let prefix = self
                .prefix_items
                .iter()
                .map(|it| it.to_cf())
                .collect::<Vec<_>>();

            CF::list(prefix, CF::Bot)
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ListItemNeg {
    pub tag: ListTag,
    pub fields: ListKV,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum ListTag {
    Open,
    Closed,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ListItem {
    pub tag: ListTag,
    pub fields: ListKV,
    pub negs: Vec<ListItemNeg>,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ListTy2(pub Vec<ListItem>);
impl ListTy2 {
    pub fn new_empty_list() -> ListTy2 {
        ListTy2(vec![ListItem {
            fields: ListKV {
                prefix_items: vec![],
            },
            negs: vec![],
            tag: ListTag::Closed,
        }])
    }
    pub fn new_bot() -> ListTy2 {
        ListTy2(vec![])
    }
    pub fn new_top() -> ListTy2 {
        ListTy2(vec![ListItem {
            fields: ListKV {
                prefix_items: vec![],
            },
            negs: vec![],
            tag: ListTag::Open,
        }])
    }
    pub fn new_tuple(prefix: Vec<Ty>) -> ListTy2 {
        ListTy2(vec![ListItem {
            fields: ListKV {
                prefix_items: prefix,
            },
            negs: vec![],
            tag: ListTag::Open,
        }])
    }

    pub fn is_top(&self) -> bool {
        self.is_same_type(&Self::new_top())
    }

    pub fn is_subtype(&self, other: &ListTy2) -> bool {
        self.diff(other).is_bot()
    }
    pub fn is_same_type(&self, other: &ListTy2) -> bool {
        self.is_subtype(other) && other.is_subtype(self)
    }
    fn is_bot(&self) -> bool {
        self.0
            .iter()
            .all(|item| Self::is_bot_impl(&item.tag, &item.fields, &item.negs))
    }
    pub fn complement(&self) -> ListTy2 {
        Self::new_top().diff(self)
    }
    pub fn diff(&self, other: &ListTy2) -> ListTy2 {
        let mut dnf1_acc = self.0.clone();

        for it in other.0.iter() {
            let tag2 = &it.tag;
            let fields2 = &it.fields;
            let negs2 = &it.negs;

            let mut acc: Vec<ListItem> = vec![];

            let dnf1_acc_content = std::mem::take(&mut dnf1_acc);

            for ListItem {
                tag: tag1,
                fields: fields1,
                negs: negs1,
            } in dnf1_acc_content.into_iter()
            {
                // # Prune negations that have no values in common

                match tuple_literal_intersection(&tag1, &fields1, tag2, &fields2) {
                    Err(_) => acc.push(ListItem {
                        tag: tag1.clone(),
                        fields: fields1.clone(),
                        negs: negs1.clone(),
                    }),
                    Ok(_) => {
                        acc.push(ListItem {
                            tag: tag1.clone(),
                            fields: fields1.clone(),
                            negs: vec![ListItemNeg {
                                tag: tag2.clone(),
                                fields: fields2.clone(),
                            }]
                            .into_iter()
                            .chain(negs1.iter().cloned())
                            .collect(),
                        });
                    }
                }

                for ListItemNeg {
                    tag: neg_tag2,
                    fields: neg_fields2,
                } in negs2.iter()
                {
                    if let Ok(ListItemNeg { tag, fields }) =
                        tuple_literal_intersection(&tag1, &fields1, &neg_tag2, &neg_fields2)
                    {
                        acc.push(ListItem {
                            tag,
                            fields,
                            negs: negs1.clone(),
                        });
                    }
                }
            }

            dnf1_acc = acc;
        }

        ListTy2(dnf1_acc)
    }
    pub fn union(&self, other: &ListTy2) -> ListTy2 {
        let mut acc = vec_union(&self.0, &other.0);
        acc.retain(|it| !Self::is_bot_impl(&it.tag, &it.fields, &it.negs));
        ListTy2(acc)
    }
    pub fn intersect(&self, other: &ListTy2) -> ListTy2 {
        let dnf1 = &self.0;
        let dnf2 = &other.0;

        let mut acc = vec![];
        for ListItem {
            tag: tag1,
            fields: pos1,
            negs: negs1,
        } in dnf1
        {
            for ListItem {
                tag: tag2,
                fields: pos2,
                negs: negs2,
            } in dnf2
            {
                if let Ok(ListItemNeg { tag, fields }) =
                    tuple_literal_intersection(tag1, pos1, tag2, pos2)
                {
                    let entry = ListItem {
                        tag,
                        fields,
                        negs: vec_union(negs1, negs2),
                    };

                    // Imagine a, b, c, where a is closed and b and c are open with
                    // no keys in common. The result in both cases will be a and we
                    // want to avoid adding duplicates, especially as intersection
                    // is a cartesian product.
                    if acc.contains(&entry) {
                        continue;
                    }
                    acc.push(entry);
                }
            }
        }
        ListTy2(acc)
    }
    pub fn to_cf(&self) -> CF {
        let mut acc: Vec<CF> = vec![];

        for it in &self.0 {
            let mut acc2 = vec![];
            acc2.push(it.fields.to_cf(&it.tag));

            for n in &it.negs {
                match n.fields.to_cf(&it.tag) {
                    //     CF::Bot => {}
                    it => {
                        acc2.push(CF::not(it));
                    }
                }
            }

            acc.push(CF::and(acc2));
        }

        CF::or(acc)
    }

    fn is_bot_impl(tag: &ListTag, fields: &ListKV, negs: &[ListItemNeg]) -> bool {
        match negs.split_first() {
            // No negations, so not empty unless there's an empty type
            None => fields.prefix_items.iter().any(|it| it.is_bot()),
            Some((
                ListItemNeg {
                    tag: neg_tag,
                    fields: neg_fields,
                },
                negs,
            )) => {
                // we have a negative 'all' erasing everything
                if *neg_tag == ListTag::Open && neg_fields.prefix_items.is_empty() {
                    return true;
                }

                if *tag == ListTag::Open && *neg_tag == ListTag::Closed && negs.is_empty() {
                    return fields.prefix_items.iter().any(|it| it.is_bot());
                }

                let n = fields.prefix_items.len();
                let m = neg_fields.prefix_items.len();

                if (*tag == ListTag::Closed && n < m) || (*tag == ListTag::Closed && n > m) {
                    Self::is_bot_impl(tag, fields, negs)
                } else {
                    tuple_elements_empty(&[], tag, fields, neg_fields, negs)
                        && tuple_compatibility(n, m, tag, fields, neg_tag, negs)
                }
            }
        }
    }
}
struct IsEmptyEarlyStop;

fn tuple_literal_intersection(
    tag1: &ListTag,
    elements1: &ListKV,
    tag2: &ListTag,
    elements2: &ListKV,
) -> Result<ListItemNeg, IsEmptyEarlyStop> {
    let n = elements1.prefix_items.len();
    let m = elements2.prefix_items.len();

    if (tag1 == &ListTag::Closed && n < m) || (tag2 == &ListTag::Closed && n > m) {
        return Err(IsEmptyEarlyStop);
    }

    if tag1 == &ListTag::Open && tag2 == &ListTag::Open {
        let fields = zip_non_empty_intersection(elements1, elements2, &[])?;
        Ok(ListItemNeg {
            tag: ListTag::Open,
            fields,
        })
    } else {
        let fields = zip_non_empty_intersection(elements1, elements2, &[])?;
        Ok(ListItemNeg {
            tag: ListTag::Closed,
            fields,
        })
    }
}

fn enum_reverse<T: Clone>(enumerable: &[T], tail: &[T]) -> Vec<T> {
    // Reverses the elements in enumerable, appends the tail, and returns it as a list.
    let mut acc: Vec<T> = vec![];
    for it in enumerable.iter().rev() {
        acc.push(it.clone());
    }
    acc.extend_from_slice(tail);
    acc
}

fn zip_non_empty_intersection(
    elements1: &ListKV,
    elements2: &ListKV,
    acc: &[Ty],
) -> Result<ListKV, IsEmptyEarlyStop> {
    // # Intersects two lists of types, and _appends_ the extra elements to the result.
    // defp zip_non_empty_intersection!([], types2, acc), do: Enum.reverse(acc, types2)
    // defp zip_non_empty_intersection!(types1, [], acc), do: Enum.reverse(acc, types1)

    // defp zip_non_empty_intersection!([type1 | rest1], [type2 | rest2], acc) do
    //   zip_non_empty_intersection!(rest1, rest2, [non_empty_intersection!(type1, type2) | acc])
    // end
    if elements1.prefix_items.is_empty() {
        return Ok(ListKV {
            prefix_items: enum_reverse(acc, &elements2.prefix_items),
        });
    }
    todo!()
}

fn tuple_compatibility(
    n: usize,
    m: usize,
    tag: &ListTag,
    fields: &ListKV,
    neg_tag: &ListTag,
    negs: &[ListItemNeg],
) -> bool {
    // # Determines if the set difference is empty when:
    // # - Positive tuple: {tag, elements} of size n
    // # - Negative tuple: open or closed tuples of size m

    tag == &ListTag::Closed
        || (n..m - 1).all(|i| ListTy2::is_bot_impl(&ListTag::Closed, &tuple_fill(fields, i), negs))
            && (neg_tag == &ListTag::Open
                || ListTy2::is_bot_impl(&ListTag::Open, &tuple_fill(fields, m + 1), negs))
}

fn tuple_fill(fields: &ListKV, i: usize) -> ListKV {
    let pad_length = (i as i64) - (fields.prefix_items.len() as i64);

    if pad_length < 0 {
        panic!("tuple_fill: elements are longer than the desired length");
    }

    let mut prefix_items = fields.prefix_items.clone();

    for _ in 0..pad_length {
        prefix_items.push(Ty::new_top());
    }

    ListKV { prefix_items }
}

fn tuple_elements_empty(
    acc: &[Ty],
    tag: &ListTag,
    elements: &ListKV,
    neg_fields: &ListKV,
    negs: &[ListItemNeg],
) -> bool {
    let (neg_type, neg_elements) = match neg_fields.prefix_items.split_first() {
        None => return true,
        Some((neg_type, neg_elements)) => (neg_type, neg_elements),
    };

    let t = Ty::new_top();
    let r: Vec<Ty> = vec![];
    let (ty, elements) = match elements.prefix_items.split_first() {
        Some((ty, rest)) => (ty, rest),
        None => (&t, r.as_slice()),
    };

    let diff = ty.diff(neg_type);

    diff.is_bot()
        || ListTy2::is_bot_impl(
            tag,
            &ListKV {
                prefix_items: enum_reverse(
                    acc,
                    &vec![diff]
                        .into_iter()
                        .chain(elements.iter().cloned())
                        .collect::<Vec<Ty>>(),
                ),
            },
            negs,
        ) && tuple_elements_empty(
            &vec![ty.clone()]
                .into_iter()
                .chain(acc.iter().cloned())
                .collect::<Vec<Ty>>(),
            tag,
            &ListKV {
                prefix_items: elements.to_vec(),
            },
            &ListKV {
                prefix_items: neg_elements.to_vec(),
            },
            negs,
        )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_ty2() {
        let empty_list = ListTy2::new_empty_list();
        assert!(!empty_list.is_bot());
        assert!(!empty_list.is_top());

        let bot = ListTy2::new_bot();
        assert!(bot.is_bot());

        let top = ListTy2::new_top();
        assert!(!top.is_bot());
    }

    #[test]
    fn test_list_ty_cf() {
        let empty_list = ListTy2::new_empty_list();
        insta::assert_snapshot!(empty_list.to_cf().display_impl(false), @"[]");

        let bot = ListTy2::new_bot();
        insta::assert_snapshot!(bot.to_cf().display_impl(false), @"⊥");

        let top = ListTy2::new_top();
        insta::assert_snapshot!(top.to_cf().display_impl(false), @"list");
    }

    #[test]
    fn list_subtype() {
        let top = ListTy2::new_top();
        let bot = ListTy2::new_bot();

        assert!(bot.is_bot());
        assert!(!bot.is_top());

        assert!(!top.is_bot());
        assert!(top.is_top());

        let u = top.union(&bot);
        assert!(u.is_top());

        let i = top.intersect(&bot);
        assert!(i.is_bot());

        let i2 = top.intersect(&top);
        assert_eq!(i2, top);

        let d = top.diff(&bot);
        assert!(d.is_top());

        let d2 = bot.diff(&top);
        assert!(d2.is_bot());
    }
    // #[test]
    // fn test_parametric_list() {
    //     let t1 = ListTy2::new_parametric_list(Ty::new_string_top());
    //     insta::assert_snapshot!(t1.to_cf().display_impl(false), @"[string...]");
    //     let t2 = ListTy2::new_parametric_list(Ty::new_bool_top());
    //     insta::assert_snapshot!(t2.to_cf().display_impl(false), @"[boolean...]");

    //     let u = t1.union(&t2);
    //     insta::assert_snapshot!(u.to_cf().display_impl(false), @"[]string | []boolean");

    //     let c = u.complement();
    //     insta::assert_snapshot!(c.to_cf().display_impl(false), @"null | boolean | string | mapping | (!([]string) & !([]boolean))");

    //     let back = c.complement();
    //     insta::assert_snapshot!(back.to_cf().display_impl(false), @"[]string | []boolean");

    //     assert!(back.is_same_type(&u));

    //     let c1 = c.union(&t1);
    //     insta::assert_snapshot!(c1.to_cf().display_impl(false), @"null | boolean | string | mapping | []string | (!([]string) & !([]boolean))");

    //     let c2 = c.union(&t2);
    //     insta::assert_snapshot!(c2.to_cf().display_impl(false), @"null | boolean | string | mapping | []boolean | (!([]string) & !([]boolean))");

    //     assert!(c2.is_top());
    // }
}
