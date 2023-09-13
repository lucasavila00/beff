#[cfg(test)]
mod tests {

    use std::collections::BTreeMap;

    use beff_core::{
        ast::{json::Json, json_schema::JsonSchema},
        subtyping::{
            meterialize::{Mater, MaterializationContext},
            semtype::{SemTypeContext, SemTypeOps},
            ToSemType,
        },
    };
    #[test]
    fn materialization0() {
        let validators = vec![];

        let mut ctx = SemTypeContext::new();
        let t = JsonSchema::Null.to_sub_type(&validators, &mut ctx).unwrap();
        let mut mat = MaterializationContext::new(&mut ctx);
        assert_eq!(mat.materialize(&t), Mater::Null);
    }
    #[test]
    fn materialization1() {
        let validators = vec![];

        let mut ctx = SemTypeContext::new();
        let t = JsonSchema::Null.to_sub_type(&validators, &mut ctx).unwrap();
        let mut mat = MaterializationContext::new(&mut ctx);
        assert_eq!(mat.materialize(&t), Mater::Null);

        let t = JsonSchema::String
            .to_sub_type(&validators, &mut ctx)
            .unwrap();
        let mut mat = MaterializationContext::new(&mut ctx);

        assert_eq!(mat.materialize(&t), Mater::String);

        let t = JsonSchema::Const(Json::String("def".into()))
            .to_sub_type(&validators, &mut ctx)
            .unwrap();
        let mut mat = MaterializationContext::new(&mut ctx);

        assert_eq!(mat.materialize(&t), Mater::StringLiteral("def".into()));

        let t = JsonSchema::StringWithFormat("password".into())
            .to_sub_type(&validators, &mut ctx)
            .unwrap();
        let mut mat = MaterializationContext::new(&mut ctx);

        assert_eq!(
            mat.materialize(&t),
            Mater::StringWithFormat("password".into())
        );

        let t = JsonSchema::Array(JsonSchema::String.into())
            .to_sub_type(&validators, &mut ctx)
            .unwrap();
        let mut mat = MaterializationContext::new(&mut ctx);

        assert_eq!(
            mat.materialize(&t),
            Mater::Array {
                items: Box::new(Mater::String),
                prefix_items: vec![]
            }
        );
    }

    #[test]
    fn diff_lists() {
        let validators = vec![];
        let mut ctx = SemTypeContext::new();

        let t = JsonSchema::Array(JsonSchema::String.into())
            .to_sub_type(&validators, &mut ctx)
            .unwrap();
        let t2 = t.diff(&t);
        let is_empty = t2.is_empty(&mut ctx);

        assert!(is_empty);
        let mut mat = MaterializationContext::new(&mut ctx);
        assert_eq!(
            mat.materialize(&t2),
            Mater::Array {
                items: Mater::Never.into(),
                prefix_items: vec![]
            }
        );
    }
    #[test]
    fn diff_lists2() {
        let validators = vec![];
        let mut ctx = SemTypeContext::new();

        let t0 = JsonSchema::Array(JsonSchema::String.into())
            .to_sub_type(&validators, &mut ctx)
            .unwrap();

        let t1 = JsonSchema::Array(JsonSchema::Boolean.into())
            .to_sub_type(&validators, &mut ctx)
            .unwrap();
        let t2 = t0.diff(&t1);
        let mut mat = MaterializationContext::new(&mut ctx);

        assert_eq!(
            mat.materialize(&t2),
            Mater::Array {
                items: Mater::String.into(),
                prefix_items: vec![]
            }
        );
    }
    #[test]
    fn diff_lists3() {
        let validators = vec![];
        let mut ctx = SemTypeContext::new();

        let after = JsonSchema::Array(
            JsonSchema::any_of(vec![
                //
                JsonSchema::Const(Json::String("a".into())),
                JsonSchema::Const(Json::String("b".into())),
            ])
            .into(),
        )
        .to_sub_type(&validators, &mut ctx)
        .unwrap();

        let before = JsonSchema::Array(
            JsonSchema::any_of(vec![JsonSchema::Const(Json::String("a".into()))]).into(),
        )
        .to_sub_type(&validators, &mut ctx)
        .unwrap();
        let t2 = after.diff(&before);
        assert!(!after.is_subtype(&before, &mut ctx));

        let mut mat = MaterializationContext::new(&mut ctx);
        assert_eq!(
            mat.materialize(&t2),
            Mater::Array {
                items: Mater::StringLiteral("b".into()).into(),
                prefix_items: vec![]
            }
        );
    }

    #[test]
    fn diff_tuple() {
        let validators = vec![];
        let mut ctx = SemTypeContext::new();

        let t0 = JsonSchema::Tuple {
            items: None,
            prefix_items: vec![JsonSchema::String.into()],
        }
        .to_sub_type(&validators, &mut ctx)
        .unwrap();

        let t1 = JsonSchema::Tuple {
            items: None,
            prefix_items: vec![JsonSchema::Boolean.into()],
        }
        .to_sub_type(&validators, &mut ctx)
        .unwrap();
        let t2 = t0.diff(&t1);
        let mut mat = MaterializationContext::new(&mut ctx);

        assert_eq!(
            mat.materialize(&t2),
            Mater::Array {
                items: Mater::Never.into(),
                prefix_items: vec![Mater::String]
            }
        );
    }

    #[test]
    fn tuple() {
        let validators = vec![];
        let mut ctx = SemTypeContext::new();

        let t0 = JsonSchema::Tuple {
            items: Some(Box::new(JsonSchema::Boolean)),
            prefix_items: vec![JsonSchema::String.into()],
        }
        .to_sub_type(&validators, &mut ctx)
        .unwrap();
        let mut mat = MaterializationContext::new(&mut ctx);

        assert_eq!(
            mat.materialize(&t0),
            Mater::Array {
                items: Mater::Boolean.into(),
                prefix_items: vec![Mater::String,]
            }
        );
    }
    #[test]
    fn mapping() {
        let validators = vec![];
        let mut ctx = SemTypeContext::new();

        let t0 = JsonSchema::Object(BTreeMap::new())
            .to_sub_type(&validators, &mut ctx)
            .unwrap();
        let mut mat = MaterializationContext::new(&mut ctx);

        assert_eq!(mat.materialize(&t0), Mater::Object(BTreeMap::new()));
    }
    #[test]
    fn mapping2() {
        let validators = vec![];
        let mut ctx = SemTypeContext::new();

        let t0 = JsonSchema::Object(BTreeMap::from_iter(vec![
            ("a".into(), JsonSchema::String.required()),
            ("b".into(), JsonSchema::Boolean.optional()),
        ]))
        .to_sub_type(&validators, &mut ctx)
        .unwrap();
        let mut mat = MaterializationContext::new(&mut ctx);

        assert_eq!(
            mat.materialize(&t0),
            Mater::Object(BTreeMap::from_iter(vec![
                ("a".into(), Mater::String),
                ("b".into(), Mater::Void),
            ]))
        );
    }
    #[test]
    fn mapping_diff() {
        let validators = vec![];
        let mut ctx = SemTypeContext::new();

        let before = JsonSchema::Object(BTreeMap::from_iter(vec![
            ("a".into(), JsonSchema::String.required()),
            ("b".into(), JsonSchema::Boolean.required()),
        ]))
        .to_sub_type(&validators, &mut ctx)
        .unwrap();

        let after = JsonSchema::Object(BTreeMap::from_iter(vec![
            ("a".into(), JsonSchema::String.required()),
            ("b".into(), JsonSchema::Boolean.optional()),
        ]))
        .to_sub_type(&validators, &mut ctx)
        .unwrap();

        assert!(!after.is_subtype(&before, &mut ctx));
        let t2 = after.diff(&before);

        assert!(!t2.is_empty(&mut ctx));

        let mut mat = MaterializationContext::new(&mut ctx);

        assert_eq!(
            mat.materialize(&t2),
            // Mater::Never,
            Mater::Object(BTreeMap::from_iter(vec![
                ("a".into(), Mater::Never),
                ("b".into(), Mater::Void),
            ]))
        );
    }
    #[test]
    fn intersect_to_never() {
        let validators = vec![];

        let mut ctx = SemTypeContext::new();

        let t = JsonSchema::Null.to_sub_type(&validators, &mut ctx).unwrap();
        let t2 = JsonSchema::String
            .to_sub_type(&validators, &mut ctx)
            .unwrap()
            .intersect(&t);
        let mut mat = MaterializationContext::new(&mut ctx);

        assert_eq!(mat.materialize(&t2), Mater::Never);
    }
}
