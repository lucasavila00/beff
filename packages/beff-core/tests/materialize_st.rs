#[cfg(test)]
mod tests {

    use beff_core::{
        ast::{json::Json, json_schema::JsonSchema},
        subtyping::{
            semtype::{MaterializationJson, SemTypeContext, SemTypeOps},
            ToSemType,
        },
    };

    #[test]
    fn materialization1() {
        let validators = vec![];

        let mut ctx = SemTypeContext::new();
        let t = JsonSchema::Null.to_sub_type(&validators, &mut ctx).unwrap();
        assert_eq!(ctx.materialize(&t), MaterializationJson::Null);

        let t = JsonSchema::String
            .to_sub_type(&validators, &mut ctx)
            .unwrap();
        assert_eq!(
            ctx.materialize(&t),
            MaterializationJson::String("abc".into())
        );

        let t = JsonSchema::Const(Json::String("def".into()))
            .to_sub_type(&validators, &mut ctx)
            .unwrap();
        assert_eq!(
            ctx.materialize(&t),
            MaterializationJson::String("def".into())
        );

        let t = JsonSchema::StringWithFormat("password".into())
            .to_sub_type(&validators, &mut ctx)
            .unwrap();
        assert_eq!(
            ctx.materialize(&t),
            MaterializationJson::StringWithFormat("password".into())
        );

        let t = JsonSchema::Array(JsonSchema::String.into())
            .to_sub_type(&validators, &mut ctx)
            .unwrap();

        assert_eq!(
            ctx.materialize(&t),
            MaterializationJson::Array(vec![MaterializationJson::String("abc".into())])
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

        assert_eq!(
            ctx.materialize(&t2),
            MaterializationJson::Array(vec![MaterializationJson::Bot])
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

        assert_eq!(
            ctx.materialize(&t2),
            MaterializationJson::Array(vec![MaterializationJson::String("abc".into())])
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

        assert_eq!(
            ctx.materialize(&t2),
            MaterializationJson::Array(vec![MaterializationJson::String("b".into())])
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

        assert_eq!(ctx.materialize(&t2), MaterializationJson::Bot);
    }
    // #[test]

    // fn diff_test() {
    //     let validators = vec![];
    //     let mut ctx = SemTypeContext::new();

    //     let t = JsonSchema::String
    //         .to_sub_type(&validators, &mut ctx)
    //         .unwrap();

    //     dbg!(&t);
    //     dbg!(&t.complement());
    // }
}
