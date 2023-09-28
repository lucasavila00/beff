// Describes the relationship between a StringSubtype and a list of strings
// How the StringSubtype covers the list and vice versa.

use std::cmp::Ordering;

use super::subtype::StringLitOrFormat;

pub struct StringSubtypeListCoverage {
    // true if the StringSubtype is a subtype of the type containing the strings in the lists
    pub is_subtype: bool,
    // contains the index in order of each member of the list that is in the StringSubtype
    pub indices: Vec<String>,
}

pub type StringSubtype<'a> = (bool, &'a Vec<StringLitOrFormat>);
/// Returns a description of the relationship between a StringSubtype and a list of strings
/// `values` must be ordered.
pub fn string_subtype_list_coverage(
    subtype: StringSubtype,
    values: Vec<&String>,
) -> StringSubtypeListCoverage {
    let mut indices = vec![];

    let mut string_const_len = 0;

    let (allowed, non_char) = subtype;

    if allowed {
        string_list_intersect(
            values,
            non_char
                .iter()
                .flat_map(|it| match it {
                    StringLitOrFormat::Lit(s) => vec![s],
                    StringLitOrFormat::Format(_) => vec![],
                    StringLitOrFormat::Codec(_) => vec![],
                })
                .collect(),
            &mut indices,
        );

        string_const_len = string_const_len + non_char.len();
    } else if non_char.len() == 0 {
        for value in values {
            indices.push((*value).clone());
        }
    }

    StringSubtypeListCoverage {
        is_subtype: string_const_len == indices.len(),
        indices: indices,
    }
}

fn string_list_intersect(values: Vec<&String>, target: Vec<&String>, indices: &mut Vec<String>) {
    let mut i1 = 0;
    let mut i2 = 0;
    let len1 = values.len();
    let len2 = target.len();

    loop {
        if i1 >= len1 || i2 >= len2 {
            break;
        } else {
            match values[i1].cmp(target[i2]) {
                Ordering::Less => {
                    i1 += 1;
                }
                Ordering::Greater => {
                    i2 += 1;
                }
                Ordering::Equal => {
                    indices.push((*values[i1]).clone());
                    i1 += 1;
                    i2 += 1;
                }
            }
        }
    }
}
