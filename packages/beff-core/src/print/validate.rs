//! Generated validate functions.
//!
//! The printer hoists every runtype node into `direct_hoist_<id>`. This module compiles the `validate`
//! method of those nodes into plain JS: one small function `v<id>` per object, array, union or
//! discriminated union node. A ref is a call to the function of its target, so nothing is inlined
//! across named types, and V8 decides what to inline. Leaves (`typeof`, nullish and const checks) are
//! inlined at their use. Any other node, like records, intersections, tuples and formats, calls the
//! hoisted runtype's `validate`, so it behaves exactly as before.
//!
//! The functions mirror the runtype classes in `@beff/client/codegen-v2`, and only `validate` uses
//! them. Tests run with `BEFF_CHECK_GENERATED_VALIDATE=1`, which checks each result against the tree.
use std::collections::{BTreeMap, BTreeSet};

use swc_ecma_ast::{Expr, Lit, Prop, PropName, PropOrSpread};

use super::printer::hoist_name;

pub(super) enum ValidateNode {
    Typeof(String),
    Nullish,
    Any,
    Never,
    // A JS literal.
    Const(String),
    // A ref, by its printed name.
    Ref(String),
    Array(usize),
    // Properties: key, node id, optional.
    Object(Vec<(String, usize, bool)>),
    AnyOf(Vec<usize>),
    Discriminated(String, Vec<(String, usize)>),
    // Not generated: call the hoisted runtype.
    Tree,
}

fn hoist_id(e: &Expr) -> Option<usize> {
    match e {
        Expr::Ident(id) => id.sym.strip_prefix("direct_hoist_")?.parse().ok(),
        _ => None,
    }
}

fn str_lit(e: &Expr) -> Option<String> {
    match e {
        Expr::Lit(Lit::Str(s)) => s.value.as_str().map(|it| it.to_string()),
        _ => None,
    }
}

fn js_str(s: &str) -> String {
    serde_json::to_string(s).expect("strings can be serialized")
}

fn const_lit(e: &Expr) -> Option<String> {
    match e {
        Expr::Lit(Lit::Bool(b)) => Some(b.value.to_string()),
        Expr::Lit(Lit::Num(n)) if n.value.is_finite() => Some(n.value.to_string()),
        Expr::Lit(Lit::Str(_)) => str_lit(e).map(|it| js_str(&it)),
        _ => None,
    }
}

// The key/value pairs of an object literal. `__proto__` is left to the tree: in an object literal
// it sets the prototype instead of a property.
fn object_entries(e: &Expr) -> Option<Vec<(String, &Expr)>> {
    let Expr::Object(obj) = e else { return None };
    obj.props
        .iter()
        .map(|it| match it {
            PropOrSpread::Prop(p) => match p.as_ref() {
                Prop::KeyValue(kv) => match &kv.key {
                    PropName::Str(s) => {
                        let key = s.value.as_str()?;
                        (key != "__proto__").then(|| (key.to_string(), kv.value.as_ref()))
                    }
                    _ => None,
                },
                _ => None,
            },
            PropOrSpread::Spread(_) => None,
        })
        .collect()
}

impl ValidateNode {
    // Reads a hoisted runtype, as the printer built it.
    pub(super) fn from_expr(e: &Expr) -> Self {
        Self::try_from_expr(e).unwrap_or(ValidateNode::Tree)
    }

    fn try_from_expr(e: &Expr) -> Option<Self> {
        let Expr::New(new) = e else { return None };
        let Expr::Ident(callee) = new.callee.as_ref() else {
            return None;
        };
        let args = new
            .args
            .as_ref()?
            .iter()
            .map(|it| it.expr.as_ref())
            .collect::<Vec<_>>();
        let arg = |idx: usize| args.get(idx).copied();
        Some(match callee.sym.as_ref() {
            "TypeofRuntype" => ValidateNode::Typeof(str_lit(arg(1)?)?),
            "NullishRuntype" => ValidateNode::Nullish,
            "AnyRuntype" => ValidateNode::Any,
            "NeverRuntype" => ValidateNode::Never,
            "ConstRuntype" => ValidateNode::Const(const_lit(arg(1)?)?),
            "RefRuntype" => ValidateNode::Ref(str_lit(arg(1)?)?),
            "ArrayRuntype" => ValidateNode::Array(hoist_id(arg(1)?)?),
            "ObjectRuntype" => {
                let Expr::Array(indexed) = arg(2)? else {
                    return None;
                };
                if !indexed.elems.is_empty() {
                    return None;
                }
                let props = object_entries(arg(1)?)?
                    .into_iter()
                    .map(|(key, value)| match hoist_id(value) {
                        Some(id) => Some((key, id, false)),
                        None => {
                            let Expr::New(opt) = value else { return None };
                            let Expr::Ident(opt_callee) = opt.callee.as_ref() else {
                                return None;
                            };
                            if opt_callee.sym != "OptionalFieldRuntype" {
                                return None;
                            }
                            let id = hoist_id(opt.args.as_ref()?.first()?.expr.as_ref())?;
                            Some((key, id, true))
                        }
                    })
                    .collect::<Option<Vec<_>>>()?;
                ValidateNode::Object(props)
            }
            "AnyOfRuntype" => {
                let Expr::Array(arr) = arg(1)? else {
                    return None;
                };
                let ids = arr
                    .elems
                    .iter()
                    .map(|it| hoist_id(it.as_ref()?.expr.as_ref()))
                    .collect::<Option<Vec<_>>>()?;
                ValidateNode::AnyOf(ids)
            }
            "AnyOfDiscriminatedRuntype" => {
                let discriminator = str_lit(arg(2)?)?;
                let cases = object_entries(arg(3)?)?
                    .into_iter()
                    .map(|(key, value)| Some((key, hoist_id(value)?)))
                    .collect::<Option<Vec<_>>>()?;
                ValidateNode::Discriminated(discriminator, cases)
            }
            _ => return None,
        })
    }
}

// A call to the function of a root is printed as `ROOT_MARK<id>ROOT_MARK` until we know whether the root
// is generated.
const ROOT_MARK: char = '\u{1}';

struct Generator<'a> {
    nodes: &'a [ValidateNode],
    named: &'a BTreeMap<String, usize>,
    // Named types and exports with a function. Each one has its own size budget.
    roots: BTreeSet<usize>,
    // The code of each node with a function, and the nodes with a function it calls.
    functions: BTreeMap<usize, (String, Vec<usize>)>,
    pending: Vec<usize>,
    calls: Vec<usize>,
}

fn property_access(key: &str) -> String {
    let mut chars = key.chars();
    let is_identifier = chars
        .next()
        .is_some_and(|c| c.is_ascii_alphabetic() || c == '_' || c == '$')
        && chars.all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '$');
    if is_identifier {
        format!("i.{key}")
    } else {
        format!("i[{}]", js_str(key))
    }
}

impl Generator<'_> {
    // Follows refs to the node they point to. A cycle of refs stays a ref, which calls the runtype.
    fn resolve(&self, mut id: usize) -> usize {
        for _ in 0..=self.nodes.len() {
            match &self.nodes[id] {
                ValidateNode::Ref(name) => match self.named.get(name) {
                    Some(target) => id = *target,
                    None => return id,
                },
                _ => return id,
            }
        }
        id
    }

    fn is_leaf(&self, id: usize) -> bool {
        matches!(
            self.nodes[self.resolve(id)],
            ValidateNode::Typeof(_)
                | ValidateNode::Nullish
                | ValidateNode::Any
                | ValidateNode::Never
                | ValidateNode::Const(_)
        )
    }

    // Whether the node gets a function of its own.
    fn has_function(&self, id: usize) -> bool {
        match &self.nodes[id] {
            ValidateNode::Array(_) | ValidateNode::Object(_) | ValidateNode::Discriminated(..) => {
                true
            }
            ValidateNode::AnyOf(ids) => !ids.iter().all(|it| self.is_leaf(*it)),
            _ => false,
        }
    }

    // A boolean JS expression that validates `v`. `v` has no side effects and can be repeated.
    fn expr(&mut self, id: usize, v: &str) -> String {
        let id = self.resolve(id);
        if self.has_function(id) {
            self.calls.push(id);
            if !self.functions.contains_key(&id) {
                self.pending.push(id);
            }
            return if self.roots.contains(&id) {
                format!("{ROOT_MARK}{id}{ROOT_MARK}(c,{v})")
            } else {
                format!("v{id}(c,{v})")
            };
        }
        match &self.nodes[id] {
            ValidateNode::Typeof(t) => format!("typeof {v}=={}", js_str(t)),
            ValidateNode::Nullish => format!("{v}==null"),
            ValidateNode::Any => "true".to_string(),
            ValidateNode::Never => "false".to_string(),
            ValidateNode::Const(lit) => format!("{v}==={lit}"),
            ValidateNode::AnyOf(ids) => {
                let parts = ids.iter().map(|it| self.expr(*it, v)).collect::<Vec<_>>();
                format!("({})", parts.join("||"))
            }
            _ => format!("{}.validate(c,{v})", hoist_name(id)),
        }
    }

    fn function(&mut self, id: usize) -> String {
        let body = match &self.nodes[id] {
            ValidateNode::Array(item) => {
                let e = self.expr(*item, "i[k]");
                format!(
                    "if(!Array.isArray(i))return false;for(let k=0;k<i.length;k++)if(!({e}))return false;return true"
                )
            }
            ValidateNode::Object(props) => {
                let mut parts = vec!["isObj(i)".to_string()];
                for (key, prop, optional) in props {
                    let access = property_access(key);
                    let e = self.expr(*prop, &access);
                    parts.push(if *optional {
                        format!("({access}==null||{e})")
                    } else {
                        e
                    });
                }
                parts.push(format!("{}.noExtraKeys(c,i)", hoist_name(id)));
                format!("return {}", parts.join("&&"))
            }
            ValidateNode::AnyOf(ids) => {
                let parts = ids.iter().map(|it| self.expr(*it, "i")).collect::<Vec<_>>();
                format!("return {}", parts.join("||"))
            }
            ValidateNode::Discriminated(discriminator, cases) => {
                let cases = cases
                    .iter()
                    .map(|(key, case)| {
                        format!("case {}:return {}", js_str(key), self.expr(*case, "i"))
                    })
                    .collect::<Vec<_>>();
                format!(
                    "switch(discKey(i,{})){{{}}}return false",
                    js_str(discriminator),
                    cases.join(";")
                )
            }
            _ => unreachable!("only nodes with a function are generated"),
        };
        format!("function v{id}(c,i){{{body}}}")
    }

    // The functions a root uses without calling another root: the functions of its inline types.
    fn helpers_of(&self, root: usize) -> BTreeSet<usize> {
        let mut acc = BTreeSet::new();
        let mut stack = vec![root];
        while let Some(id) = stack.pop() {
            for call in &self.functions[&id].1 {
                if !self.roots.contains(call) && acc.insert(*call) {
                    stack.push(*call);
                }
            }
        }
        acc
    }
}

// Generates the validate functions reachable from `exports` (hoisted ids). Each named type and export
// gets a function only if its code, with the functions of its inline types, has at most `max_size`
// characters. The others keep calling the runtype. Returns, for each export, the function that
// validates it, if it has one, and the code of all functions.
pub(super) fn generate(
    nodes: &[ValidateNode],
    named: &BTreeMap<String, usize>,
    exports: &[usize],
    max_size: usize,
) -> (Vec<Option<String>>, String) {
    let mut generator = Generator {
        nodes,
        named,
        roots: BTreeSet::new(),
        functions: BTreeMap::new(),
        pending: vec![],
        calls: vec![],
    };
    let exports = exports
        .iter()
        .map(|it| generator.resolve(*it))
        .collect::<Vec<_>>();
    generator.roots = named
        .values()
        .chain(exports.iter())
        .map(|it| generator.resolve(*it))
        .filter(|it| generator.has_function(*it))
        .collect();
    generator.pending = exports
        .iter()
        .copied()
        .filter(|it| generator.roots.contains(it))
        .collect();
    while let Some(id) = generator.pending.pop() {
        if generator.functions.contains_key(&id) {
            continue;
        }
        let code = generator.function(id);
        let calls = std::mem::take(&mut generator.calls);
        generator.functions.insert(id, (code, calls));
    }

    // The roots within the size budget, and the functions they need.
    let mut generated = BTreeSet::new();
    let mut emitted = BTreeSet::new();
    for root in &generator.roots {
        if !generator.functions.contains_key(root) {
            continue;
        }
        let helpers = generator.helpers_of(*root);
        let size = std::iter::once(root)
            .chain(helpers.iter())
            .map(|it| generator.functions[it].0.len())
            .sum::<usize>();
        if size <= max_size {
            generated.insert(*root);
            emitted.insert(*root);
            emitted.extend(helpers);
        }
    }

    let mut code = String::new();
    for id in &emitted {
        for (idx, part) in generator.functions[id].0.split(ROOT_MARK).enumerate() {
            if idx % 2 == 0 {
                code.push_str(part);
                continue;
            }
            let callee: usize = part.parse().expect("a marked root id");
            if generated.contains(&callee) {
                code.push_str(&format!("v{callee}"));
            } else {
                code.push_str(&format!("{}.validate", hoist_name(callee)));
            }
        }
        code.push('\n');
    }
    let export_fns = exports
        .iter()
        .map(|it| generated.contains(it).then(|| format!("v{it}")))
        .collect();
    (export_fns, code)
}
