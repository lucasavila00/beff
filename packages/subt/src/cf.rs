use std::collections::BTreeMap;

use crate::mapping::MappingTag;

#[derive(Debug, Clone)]
pub enum CF {
    Or(Vec<CF>),
    And(Vec<CF>),
    Not(Box<CF>),
    Null,
    BoolTop,
    StringTop,
    ListTop,
    BoolConst(bool),
    StringConst(String),
    Ref(usize),
    Bot,
    List {
        prefix: Vec<CF>,
        rest: Box<CF>,
    },
    Mapping {
        tag: MappingTag,
        fields: BTreeMap<String, CF>,
    },
    MappingTop,
}

impl CF {
    pub fn is_bot(&self) -> bool {
        matches!(self, CF::Bot)
    }
    pub fn or(v: Vec<CF>) -> CF {
        // flatten ors
        let mut acc: Vec<CF> = vec![];
        for d in v {
            match d {
                CF::Or(v) => acc.extend(v),
                d => acc.push(d),
            }
        }
        // filter all bots
        let acc: Vec<CF> = acc.into_iter().filter(|d| !matches!(d, CF::Bot)).collect();
        // if len 0, return bot
        if acc.is_empty() {
            return CF::Bot;
        }

        // if len 1, return just it
        if acc.len() == 1 {
            acc.into_iter().next().unwrap()
        } else {
            CF::Or(acc)
        }
    }
    pub fn and(v: Vec<CF>) -> CF {
        // if len 1, return just it
        if v.len() == 1 {
            v.into_iter().next().unwrap()
        } else {
            CF::And(v)
        }
    }
    pub fn not(v: CF) -> CF {
        CF::Not(Box::new(v))
    }
    pub fn null() -> CF {
        CF::Null
    }
    pub fn bool_top() -> CF {
        CF::BoolTop
    }
    pub fn string_top() -> CF {
        CF::StringTop
    }
    pub fn list_top() -> CF {
        CF::ListTop
    }

    pub fn string_const(v: String) -> CF {
        CF::StringConst(v)
    }
    pub fn bool_const(v: bool) -> CF {
        CF::BoolConst(v)
    }
    pub fn bot() -> CF {
        CF::Bot
    }
    pub fn list(prefix: Vec<CF>, rest: CF) -> CF {
        CF::List {
            prefix,
            rest: Box::new(rest),
        }
    }

    pub fn display_impl(&self, wrap: bool) -> String {
        match self {
            CF::Or(vec) => {
                let inner = vec
                    .iter()
                    .map(|d| d.display_impl(true))
                    .collect::<Vec<String>>()
                    .join(" | ");
                if wrap {
                    format!("({})", inner)
                } else {
                    inner
                }
            }
            CF::And(vec) => {
                let inner = vec
                    .iter()
                    .map(|d| d.display_impl(true))
                    .collect::<Vec<String>>()
                    .join(" & ");
                if wrap {
                    format!("({})", inner)
                } else {
                    inner
                }
            }
            CF::Not(dnf) => {
                format!("!({})", dnf.display_impl(false))
            }
            CF::StringConst(it) => format!("'{}'", it),
            CF::BoolConst(it) => it.to_string(),
            CF::Bot => "⊥".to_owned(),
            CF::List { prefix, rest } => {
                if prefix.is_empty() {
                    if !rest.is_bot() {
                        return format!("[]{}", rest.display_impl(true));
                    }
                }
                let mut prefix = prefix
                    .iter()
                    .map(|d| d.display_impl(true))
                    .collect::<Vec<String>>()
                    .join(", ");
                if rest.is_bot() {
                    return format!("tuple[{}]", prefix);
                }
                let mut rest_part = "".to_owned();
                if !rest.is_bot() {
                    rest_part = rest_part + rest.display_impl(true).as_str() + "...";
                    if !prefix.is_empty() {
                        prefix = prefix + ", ";
                    }
                }
                format!("list[{}{}]", prefix, rest_part)
            }
            CF::Null => "null".to_owned(),
            CF::BoolTop => "boolean".to_owned(),
            CF::StringTop => "string".to_owned(),
            CF::ListTop => "list".to_owned(),
            CF::Ref(r) => format!("ref({})", r),
            CF::Mapping { fields, tag } => {
                let mut acc = vec![];
                for (k, v) in fields {
                    acc.push(format!("{}: {}", k, v.display_impl(true)));
                }
                match tag {
                    MappingTag::Open => {
                        format!("{{{}}}", acc.join(", "))
                    }
                    MappingTag::Closed => {
                        format!("{{|{}|}}", acc.join(", "))
                    }
                }
            }
            CF::MappingTop => "mapping".to_owned(),
        }
    }
}
