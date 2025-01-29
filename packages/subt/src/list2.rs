use crate::{
    cf::CF,
    sub::{vec_union, Ty},
};

// #[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
// pub enum ListKVRest {
//     Top,
//     Bot,
//     Ty(Ty),
// }
// impl ListKVRest {
//     fn is_bot(&self) -> bool {
//         match self {
//             ListKVRest::Bot => true,
//             ListKVRest::Top => false,
//             ListKVRest::Ty(ty) => ty.is_bot(),
//         }
//     }

//     fn to_ty(&self) -> Ty {
//         match self {
//             ListKVRest::Bot => Ty::new_bot(),
//             ListKVRest::Top => Ty::new_top(),
//             ListKVRest::Ty(ty) => ty.clone(),
//         }
//     }
// }

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ListKV {
    prefix_items: Vec<Ty>,
    // rest: ListKVRest,
}

impl ListKV {
    fn to_cf(&self) -> CF {
        // let prefix = self
        //     .prefix_items
        //     .iter()
        //     .map(|it| it.to_cf())
        //     .collect::<Vec<_>>();
        // let rest = match &self.rest {
        //     ListKVRest::Top => CF::ListTop,
        //     ListKVRest::Bot => CF::Bot,
        //     ListKVRest::Ty(ty) => ty.to_cf(),
        // };
        // CF::list(prefix, rest)
        todo!()
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
    // pub fn new_parametric_list(t: Ty) -> ListTy2 {
    //     ListTy2(vec![ListItem {
    //         fields: ListKV {
    //             // prefix_items: vec![],
    //             // rest: ListKVRest::Ty(t),
    //         },
    //         negs: vec![],
    //     }])
    // }
    pub fn new_tuple(prefix: Vec<Ty>) -> ListTy2 {
        ListTy2(vec![ListItem {
            fields: ListKV {
                prefix_items: prefix,
                // rest: ListKVRest::Bot,
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
        //     defp tuple_difference(dnf1, dnf2) do
        //     Enum.reduce(dnf2, dnf1, fn {tag2, elements2, negs2}, dnf1 ->
        //       Enum.reduce(dnf1, [], fn {tag1, elements1, negs1}, acc ->
        //         # Prune negations that have no values in common
        //         acc =
        //           case tuple_literal_intersection(tag1, elements1, tag2, elements2) do
        //             :empty -> [{tag1, elements1, negs1}] ++ acc
        //             _ -> [{tag1, elements1, [{tag2, elements2} | negs1]}] ++ acc
        //           end

        //         Enum.reduce(negs2, acc, fn {neg_tag2, neg_elements2}, inner_acc ->
        //           case tuple_literal_intersection(tag1, elements1, neg_tag2, neg_elements2) do
        //             :empty -> inner_acc
        //             {tag, fields} -> [{tag, fields, negs1} | inner_acc]
        //           end
        //         end)
        //       end)
        //     end)
        //     |> case do
        //       [] -> 0
        //       acc -> acc
        //     end
        //   end

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
                // acc =
                //   case tuple_literal_intersection(tag1, elements1, tag2, elements2) do
                //     :empty -> [{tag1, elements1, negs1}] ++ acc
                //     _ -> [{tag1, elements1, [{tag2, elements2} | negs1]}] ++ acc
                //   end

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
        // acc.retain(|it| !Self::is_bot_impl(&it.tag, &it.fields, &it.negs));
        ListTy2(acc)
    }
    pub fn intersect(&self, other: &ListTy2) -> ListTy2 {
        todo!()
    }
    pub fn to_cf(&self) -> CF {
        let mut acc: Vec<CF> = vec![];

        for it in &self.0 {
            let mut acc2 = vec![];
            acc2.push(it.fields.to_cf());

            for n in &it.negs {
                match n.fields.to_cf() {
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
    pos1: &ListKV,
    tag2: &ListTag,
    pos2: &ListKV,
) -> Result<ListItemNeg, IsEmptyEarlyStop> {
    //   defp tuple_literal_intersection(tag1, elements1, tag2, elements2) do
    //   n = length(elements1)
    //   m = length(elements2)

    //   cond do
    //     (tag1 == :closed and n < m) or (tag2 == :closed and n > m) ->
    //       :empty

    //     tag1 == :open and tag2 == :open ->
    //       try do
    //         {:open, zip_non_empty_intersection!(elements1, elements2, [])}
    //       catch
    //         :empty -> :empty
    //       end

    //     true ->
    //       try do
    //         {:closed, zip_non_empty_intersection!(elements1, elements2, [])}
    //       catch
    //         :empty -> :empty
    //       end
    //   end
    // end

    // # Intersects two lists of types, and _appends_ the extra elements to the result.
    // defp zip_non_empty_intersection!([], types2, acc), do: Enum.reverse(acc, types2)
    // defp zip_non_empty_intersection!(types1, [], acc), do: Enum.reverse(acc, types1)

    // defp zip_non_empty_intersection!([type1 | rest1], [type2 | rest2], acc) do
    //   zip_non_empty_intersection!(rest1, rest2, [non_empty_intersection!(type1, type2) | acc])
    // end

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
    // defp tuple_compatibility(n, m, tag, elements, neg_tag, negs) do
    //   # The tuples to consider are all those of size n to m - 1, and if the negative tuple is
    //   # closed, we also need to consider tuples of size greater than m + 1.
    //   tag == :closed or
    //     (Enum.all?(n..(m - 1)//1, &tuple_empty?(:closed, tuple_fill(elements, &1), negs)) and
    //        (neg_tag == :open or tuple_empty?(:open, tuple_fill(elements, m + 1), negs)))
    // end
    todo!()
}

fn tuple_elements_empty(
    arg: &[usize],
    tag: &ListTag,
    fields: &ListKV,
    neg_fields: &ListKV,
    negs: &[ListItemNeg],
) -> bool {
    if neg_fields.prefix_items.is_empty() {
        return true;
    }

    // # Handles the case where {tag, elements} is an open tuple, like {:open, []}
    // {ty, elements} = List.pop_at(elements, 0, term())
    // diff = difference(ty, neg_type)

    // (empty?(diff) or tuple_empty?(tag, Enum.reverse(acc, [diff | elements]), negs)) and
    //   tuple_elements_empty?([ty | acc], tag, elements, neg_elements, negs)
    todo!()
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

    // #[test]
    // fn test_list_ty_cf() {
    //     let empty_list = ListTy2::new_empty_list();
    //     insta::assert_snapshot!(empty_list.to_cf().display_impl(false), @"[]");

    //     let bot = ListTy2::new_bot();
    //     insta::assert_snapshot!(bot.to_cf().display_impl(false), @"⊥");

    //     let top = ListTy2::new_top();
    //     insta::assert_snapshot!(top.to_cf().display_impl(false), @"[list...]");
    // }

    // #[test]
    // fn test_list_ty2_diff() {
    //     let empty_list = ListTy2::new_empty_list();
    //     let bot = ListTy2::new_bot();
    //     let top = ListTy2::new_top();

    //     assert!(empty_list.diff(&empty_list).is_same_type(&empty_list));
    //     assert!(empty_list.diff(&bot).is_same_type(&empty_list));
    //     assert!(empty_list.diff(&top).is_bot());

    //     assert!(bot.diff(&empty_list).is_bot());
    //     assert!(bot.diff(&bot).is_bot());
    //     assert!(bot.diff(&top).is_bot());

    //     assert!(top.diff(&empty_list).is_top());
    //     assert!(top.diff(&bot).is_top());
    //     assert!(top.diff(&top).is_bot());
    // }
    // #[test]
    // fn test_list_ty2_diff() {
    //     let empty_list = ListTy2::new_empty_list();
    //     let bot = ListTy2::new_bot();
    //     let top = ListTy2::new_top();

    //     assert!(empty_list.diff(&empty_list).is_same_type(&empty_list));
    //     assert!(empty_list.diff(&bot).is_same_type(&empty_list));
    //     assert!(empty_list.diff(&top).is_bot());

    //     assert!(bot.diff(&empty_list).is_bot());
    //     assert!(bot.diff(&bot).is_bot());
    //     assert!(bot.diff(&top).is_bot());

    //     assert!(top.diff(&empty_list).is_top());
    //     assert!(top.diff(&bot).is_top());
    //     assert!(top.diff(&top).is_bot());
    // }

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
