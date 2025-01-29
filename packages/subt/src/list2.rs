use crate::{cf::CF, sub::Ty};

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum ListKVRest {
    Top,
    Bot,
    Ty(Ty),
}
impl ListKVRest {
    fn is_bot(&self) -> bool {
        match self {
            ListKVRest::Bot => true,
            ListKVRest::Top => false,
            ListKVRest::Ty(ty) => ty.is_bot(),
        }
    }

    fn to_ty(&self) -> Ty {
        match self {
            ListKVRest::Bot => Ty::new_bot(),
            ListKVRest::Top => Ty::new_top(),
            ListKVRest::Ty(ty) => ty.clone(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ListKV {
    prefix_items: Vec<Ty>,
    rest: ListKVRest,
}

impl ListKV {
    fn to_cf(&self) -> CF {
        let prefix = self
            .prefix_items
            .iter()
            .map(|it| it.to_cf())
            .collect::<Vec<_>>();
        let rest = match &self.rest {
            ListKVRest::Top => CF::ListTop,
            ListKVRest::Bot => CF::Bot,
            ListKVRest::Ty(ty) => ty.to_cf(),
        };
        CF::list(prefix, rest)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ListItemNeg {
    pub fields: ListKV,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ListItem {
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
                rest: ListKVRest::Bot,
            },
            negs: vec![],
        }])
    }
    pub fn new_bot() -> ListTy2 {
        ListTy2(vec![])
    }
    pub fn new_top() -> ListTy2 {
        ListTy2(vec![ListItem {
            fields: ListKV {
                prefix_items: vec![],
                rest: ListKVRest::Top,
            },
            negs: vec![],
        }])
    }
    pub fn new_parametric_list(t: Ty) -> ListTy2 {
        ListTy2(vec![ListItem {
            fields: ListKV {
                prefix_items: vec![],
                rest: ListKVRest::Ty(t),
            },
            negs: vec![],
        }])
    }
    pub fn new_tuple(prefix: Vec<Ty>) -> ListTy2 {
        ListTy2(vec![ListItem {
            fields: ListKV {
                prefix_items: prefix,
                rest: ListKVRest::Bot,
            },
            negs: vec![],
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
            .all(|item| Self::is_bot_impl(&item.fields, &item.negs))
    }
    pub fn complement(&self) -> ListTy2 {
        Self::new_top().diff(self)
    }
    pub fn diff(&self, other: &ListTy2) -> ListTy2 {
        let mut dnf1_acc = self.0.clone();

        for ListItem {
            fields: fields2,
            negs: negs2,
        } in other.0.iter()
        {
            let mut acc: Vec<ListItem> = vec![];

            let dnf1_acc_content = std::mem::take(&mut dnf1_acc);

            for ListItem {
                fields: fields1,
                negs: negs1,
            } in dnf1_acc_content.into_iter()
            {
                let mut negs_new = vec![ListItemNeg {
                    fields: fields2.clone(),
                }];
                negs_new.extend(negs1.clone());

                acc.push(ListItem {
                    fields: fields1.clone(),
                    negs: negs_new,
                });

                for ListItemNeg {
                    fields: neg_fields2,
                } in negs2.iter()
                {
                    if let Ok(ListItemNeg { fields }) =
                        list_literal_intersection(&fields1, &neg_fields2)
                    {
                        acc.push(ListItem {
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
        todo!()
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

    fn is_bot_impl(fields: &ListKV, negs: &[ListItemNeg]) -> bool {
        match negs.split_first() {
            None => fields.prefix_items.iter().any(|it| it.is_bot()) && fields.rest.is_bot(),
            Some((ListItemNeg { fields: neg_fields }, negs)) => {
                let prefix_part = neg_fields.prefix_items.iter().all(|it| {
                    //
                    todo!()
                }) && fields.prefix_items.iter().all(|it| {
                    //
                    todo!()
                });

                let rest_part = match (&fields.rest, &neg_fields.rest) {
                    (ListKVRest::Bot, _) => true,
                    (_, ListKVRest::Bot) => false,
                    (ListKVRest::Top, _) => false,
                    (_, ListKVRest::Top) => true,
                    (ListKVRest::Ty(ty1), ListKVRest::Ty(ty2)) => todo!(),
                };

                (prefix_part && rest_part) || Self::is_bot_impl(fields, negs)
            }
        }
    }
}

struct IsEmptyEarlyStop;

fn list_literal_intersection(
    pos1: &ListKV,
    pos2: &ListKV,
) -> Result<ListItemNeg, IsEmptyEarlyStop> {
    let mut prefix = vec![];

    let max_len = pos1.prefix_items.len().max(pos2.prefix_items.len());

    let rest1ty = pos1.rest.to_ty();
    let rest2ty = pos2.rest.to_ty();
    for i in 0..max_len {
        let ty1 = pos1.prefix_items.get(i).unwrap_or_else(|| &rest1ty);
        let ty2 = pos2.prefix_items.get(i).unwrap_or_else(|| &rest2ty);

        prefix.push(ty1.intersect(ty2));
    }

    let rest = rest1ty.intersect(&rest2ty);

    Ok(ListItemNeg {
        fields: ListKV {
            prefix_items: prefix,
            rest: ListKVRest::Ty(rest),
        },
    })
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
        insta::assert_snapshot!(top.to_cf().display_impl(false), @"[list...]");
    }

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
