use crate::ast::json_schema::{
    CodecName, JsonSchema, JsonSchemaConst, Optionality, TplLitTypeItem,
};
use crate::diag::{
    Diagnostic, DiagnosticInfoMessage, DiagnosticInformation, DiagnosticParentMessage, Location,
};
use crate::subtyping::semtype::{SemType, SemTypeContext, SemTypeOps};
use crate::subtyping::subtype::StringLitOrFormat;
use crate::subtyping::to_schema::to_validators;
use crate::subtyping::ToSemType;
use crate::sym_reference::{ResolvedLocalSymbol, TsBuiltIn, TypeResolver};
use crate::NamedSchema;
use crate::{BeffUserSettings, BffFileName, FileManager, ImportReference, SymbolExport};
use std::collections::{BTreeMap, HashMap};
use std::rc::Rc;
use swc_atoms::JsWord;
use swc_common::{Span, Spanned};
use swc_ecma_ast::{
    Expr, Ident, Lit, MemberProp, Prop, PropName, PropOrSpread, Str, TruePlusMinus, TsArrayType,
    TsConditionalType, TsConstructorType, TsEntityName, TsEnumDecl, TsEnumMemberId,
    TsExprWithTypeArgs, TsFnOrConstructorType, TsFnType, TsImportType, TsIndexedAccessType,
    TsInferType, TsInterfaceDecl, TsIntersectionType, TsKeywordType, TsKeywordTypeKind, TsLit,
    TsLitType, TsMappedType, TsOptionalType, TsParenthesizedType, TsQualifiedName, TsRestType,
    TsThisType, TsTplLitType, TsTupleType, TsType, TsTypeElement, TsTypeLit, TsTypeOperator,
    TsTypeOperatorOp, TsTypeParam, TsTypeParamDecl, TsTypeParamInstantiation, TsTypePredicate,
    TsTypeQuery, TsTypeQueryExpr, TsTypeRef, TsUnionOrIntersectionType, TsUnionType,
};

pub struct TypeToSchema<'a, 'b, R: FileManager> {
    pub files: &'a mut R,
    pub current_file: BffFileName,
    pub components: HashMap<String, Option<NamedSchema>>,
    pub ref_stack: Vec<DiagnosticInformation>,
    pub type_param_stack: Vec<BTreeMap<String, JsonSchema>>,
    pub settings: &'a BeffUserSettings,
    pub counter: &'b mut usize,
}

fn extract_items_from_array(it: JsonSchema) -> JsonSchema {
    match it {
        JsonSchema::Array(items) => *items,
        _ => it,
    }
}

type Res<T> = Result<T, Box<Diagnostic>>;

impl<'a, 'b, R: FileManager> TypeToSchema<'a, 'b, R> {
    pub fn new(
        files: &'a mut R,
        current_file: BffFileName,
        settings: &'a BeffUserSettings,
        counter: &'b mut usize,
    ) -> TypeToSchema<'a, 'b, R> {
        TypeToSchema {
            files,
            current_file,
            components: HashMap::new(),
            ref_stack: vec![],
            type_param_stack: vec![],
            settings,
            counter,
        }
    }
    fn ts_keyword_type_kind_to_json_schema(
        &mut self,
        kind: TsKeywordTypeKind,
        span: &Span,
    ) -> Res<JsonSchema> {
        match kind {
            TsKeywordTypeKind::TsVoidKeyword
            | TsKeywordTypeKind::TsUndefinedKeyword
            | TsKeywordTypeKind::TsNullKeyword => Ok(JsonSchema::Null),

            TsKeywordTypeKind::TsBigIntKeyword => Ok(JsonSchema::Codec(CodecName::BigInt)),
            TsKeywordTypeKind::TsAnyKeyword | TsKeywordTypeKind::TsUnknownKeyword => {
                Ok(JsonSchema::Any)
            }
            TsKeywordTypeKind::TsObjectKeyword => {
                Ok(JsonSchema::object(vec![], Some(JsonSchema::Any.into())))
            }
            TsKeywordTypeKind::TsNeverKeyword
            | TsKeywordTypeKind::TsSymbolKeyword
            | TsKeywordTypeKind::TsIntrinsicKeyword => self.cannot_serialize_error(
                span,
                DiagnosticInfoMessage::KeywordNonSerializableToJsonSchema,
            ),
            TsKeywordTypeKind::TsNumberKeyword => Ok(JsonSchema::Number),
            TsKeywordTypeKind::TsBooleanKeyword => Ok(JsonSchema::Boolean),
            TsKeywordTypeKind::TsStringKeyword => Ok(JsonSchema::String),
        }
    }
    fn convert_ts_type_element(
        &mut self,
        prop: &TsTypeElement,
    ) -> Res<(String, Optionality<JsonSchema>)> {
        match prop {
            TsTypeElement::TsPropertySignature(prop) => {
                let key = match &*prop.key {
                    Expr::Ident(ident) => ident.sym.to_string(),
                    Expr::Lit(Lit::Str(st)) => st.value.to_string(),
                    _ => {
                        return self.error(&prop.span, DiagnosticInfoMessage::PropKeyShouldBeIdent)
                    }
                };
                match &prop.type_ann.as_ref() {
                    Some(val) => {
                        let value = self.convert_ts_type(&val.type_ann)?;
                        let value = if prop.optional {
                            value.optional()
                        } else {
                            value.required()
                        };
                        Ok((key, value))
                    }
                    None => self.error(
                        &prop.span,
                        DiagnosticInfoMessage::PropShouldHaveTypeAnnotation,
                    ),
                }
            }
            TsTypeElement::TsIndexSignature(_) => self.cannot_serialize_error(
                &prop.span(),
                DiagnosticInfoMessage::IndexSignatureNonSerializableToJsonSchema,
            ),
            TsTypeElement::TsGetterSignature(_)
            | TsTypeElement::TsSetterSignature(_)
            | TsTypeElement::TsMethodSignature(_)
            | TsTypeElement::TsCallSignatureDecl(_)
            | TsTypeElement::TsConstructSignatureDecl(_) => self.cannot_serialize_error(
                &prop.span(),
                DiagnosticInfoMessage::PropertyNonSerializableToJsonSchema,
            ),
        }
    }
    fn convert_pick_keys(
        obj: &BTreeMap<String, Optionality<JsonSchema>>,
        keys: Vec<String>,
    ) -> JsonSchema {
        let mut acc = vec![];
        for (k, v) in obj {
            if keys.contains(k) {
                acc.push((k.clone(), v.clone()));
            }
        }
        JsonSchema::object(acc, None)
    }
    fn convert_pick(
        &mut self,
        span: &Span,
        obj: &BTreeMap<String, Optionality<JsonSchema>>,
        keys: JsonSchema,
    ) -> Res<JsonSchema> {
        match keys {
            JsonSchema::Const(JsonSchemaConst::String(str)) => {
                Ok(Self::convert_pick_keys(obj, vec![str]))
            }
            JsonSchema::AnyOf(rms) => {
                let mut keys = vec![];
                for rm in rms {
                    match rm {
                        JsonSchema::Const(JsonSchemaConst::String(str)) => {
                            keys.push(str);
                        }
                        JsonSchema::Ref(n) => {
                            let map = self.components.get(&n).and_then(|it| it.as_ref()).cloned();
                            match map {
                                Some(NamedSchema {
                                    schema: JsonSchema::Const(JsonSchemaConst::String(str)),
                                    ..
                                }) => keys.push(str),
                                _ => {
                                    return self.error(
                                        span,
                                        DiagnosticInfoMessage::PickShouldHaveStringAsTypeArgument,
                                    )
                                }
                            }
                        }
                        _ => {
                            return self.error(
                                span,
                                DiagnosticInfoMessage::PickShouldHaveStringAsTypeArgument,
                            )
                        }
                    }
                }
                Ok(Self::convert_pick_keys(obj, keys))
            }
            _ => self.error(
                span,
                DiagnosticInfoMessage::PickShouldHaveStringOrStringArrayAsTypeArgument,
            ),
        }
    }

    fn convert_omit_keys(
        obj: &BTreeMap<String, Optionality<JsonSchema>>,
        keys: Vec<String>,
    ) -> JsonSchema {
        let mut acc = vec![];
        for (k, v) in obj {
            if !keys.contains(k) {
                acc.push((k.clone(), v.clone()));
            }
        }
        JsonSchema::object(acc, None)
    }

    fn convert_omit(
        &mut self,
        span: &Span,
        obj: &BTreeMap<String, Optionality<JsonSchema>>,
        keys: JsonSchema,
    ) -> Res<JsonSchema> {
        let keys = self
            .extract_union(keys)
            .map_err(|e| self.box_error(span, e))?;
        let str_keys = keys
            .iter()
            .map(|it| match it {
                JsonSchema::Const(JsonSchemaConst::String(str)) => Ok(str.clone()),
                _ => self.error(
                    span,
                    DiagnosticInfoMessage::OmitShouldHaveStringAsTypeArgument,
                ),
            })
            .collect::<Res<Vec<_>>>()?;
        Ok(Self::convert_omit_keys(obj, str_keys))
    }
    fn convert_required(&mut self, obj: &BTreeMap<String, Optionality<JsonSchema>>) -> JsonSchema {
        let mut acc = vec![];
        for (k, v) in obj {
            acc.push((k.clone(), v.clone().to_required()));
        }
        JsonSchema::object(acc, None)
    }
    fn convert_partial(&mut self, obj: &BTreeMap<String, Optionality<JsonSchema>>) -> JsonSchema {
        let mut acc = vec![];
        for (k, v) in obj {
            acc.push((k.clone(), v.clone().to_optional()));
        }
        JsonSchema::object(acc, None)
    }

    fn extract_array(&mut self, arr: JsonSchema, span: Span) -> Res<JsonSchema> {
        match arr {
            JsonSchema::Array(items) => Ok(*items),
            JsonSchema::Ref(n) => {
                let map = self.components.get(&n).and_then(|it| it.as_ref()).cloned();
                match map {
                    Some(NamedSchema { schema, .. }) => self.extract_array(schema, span),
                    _ => self.error(&span, DiagnosticInfoMessage::ExpectedArray),
                }
            }
            _ => self.error(&span, DiagnosticInfoMessage::ExpectedArray),
        }
    }
    fn extract_tuple(&mut self, arr: JsonSchema, span: Span) -> Res<Vec<JsonSchema>> {
        match arr {
            JsonSchema::Tuple {
                mut prefix_items,
                items,
            } => {
                if let Some(r) = items {
                    prefix_items.push(*r);
                }
                Ok(prefix_items)
            }
            JsonSchema::Ref(n) => {
                let map = self.components.get(&n).and_then(|it| it.as_ref()).cloned();
                match map {
                    Some(NamedSchema { schema, .. }) => self.extract_tuple(schema, span),
                    _ => self.error(&span, DiagnosticInfoMessage::ExpectedTuple),
                }
            }
            _ => self.error(&span, DiagnosticInfoMessage::ExpectedTuple),
        }
    }

    fn extract_object(
        &mut self,
        obj: &JsonSchema,
        span: &Span,
    ) -> Res<BTreeMap<String, Optionality<JsonSchema>>> {
        match obj {
            JsonSchema::Object { vs, rest } => match rest {
                Some(_) => self.error(span, DiagnosticInfoMessage::RestFoundOnExtractObject),
                None => Ok(vs.clone()),
            },
            JsonSchema::Ref(r) => {
                let map = self.components.get(r).and_then(|it| it.as_ref()).cloned();
                match map {
                    Some(NamedSchema { schema, .. }) => self.extract_object(&schema, span),
                    None => self.error(span, DiagnosticInfoMessage::ShouldHaveObjectAsTypeArgument),
                }
            }
            JsonSchema::AllOf(vs) => {
                let mut acc = BTreeMap::new();

                for v in vs {
                    let extracted = self.extract_object(v, span)?;

                    // check that if items have the same key, they have the same value

                    for (k, v) in &extracted {
                        if let Some(existing) = acc.get(k) {
                            if existing != v {
                                return self
                                    .error(span, DiagnosticInfoMessage::ObjectHasConflictingKeyValueInIntersection);
                            }
                        }
                    }

                    acc.extend(extracted);
                }

                Ok(acc)
            }
            _ => self.error(span, DiagnosticInfoMessage::ShouldHaveObjectAsTypeArgument),
        }
    }

    fn collect_consts_from_union(
        &self,
        it: JsonSchema,
    ) -> Result<Vec<String>, DiagnosticInfoMessage> {
        let mut string_keys = vec![];

        for v in self.extract_union(it)? {
            match v {
                JsonSchema::Const(JsonSchemaConst::String(str)) => {
                    string_keys.push(str.clone());
                }
                JsonSchema::Ref(r) => {
                    let reference = self.components.get(&r).and_then(|it| it.as_ref()).cloned();
                    match reference {
                        Some(NamedSchema { schema, .. }) => {
                            let mut out = self.collect_consts_from_union(schema)?;
                            string_keys.append(&mut out);
                        }
                        _ => {
                            return Err(DiagnosticInfoMessage::RecordKeyReferenceNotFound);
                        }
                    }
                }
                _ => {
                    return Err(DiagnosticInfoMessage::RecordKeyUnionShouldBeOnlyStrings);
                }
            }
        }

        Ok(string_keys)
    }

    fn convert_ts_built_in(
        &mut self,
        typ: &TsBuiltIn,
        type_args: &Option<Box<TsTypeParamInstantiation>>,
    ) -> Res<JsonSchema> {
        match typ {
            TsBuiltIn::TsObject(_) => Ok(JsonSchema::Object {
                vs: BTreeMap::new(),
                rest: Some(Box::new(JsonSchema::Any)),
            }),

            TsBuiltIn::TsRecord(span) => match type_args {
                Some(vs) => {
                    let items = vs
                        .params
                        .iter()
                        .map(|it| self.convert_ts_type(it))
                        .collect::<Res<Vec<_>>>()?;

                    if items.len() != 2 {
                        return self.error(
                            span,
                            DiagnosticInfoMessage::RecordShouldHaveTwoTypeArguments,
                        );
                    }

                    let mut key = Box::new(items[0].clone());
                    let mut is_ref = matches!(&*key, JsonSchema::Ref(_));

                    while is_ref {
                        if let JsonSchema::Ref(r) = &items[0] {
                            let map = self.components.get(r).and_then(|it| it.as_ref()).cloned();
                            if let Some(NamedSchema { schema, .. }) = map {
                                key = Box::new(schema);
                                is_ref = matches!(&*key, JsonSchema::Ref(_));
                            }
                        }
                    }

                    match key.as_ref() {
                        JsonSchema::String => {
                            let value = items[1].clone();
                            Ok(JsonSchema::Object {
                                vs: BTreeMap::new(),
                                rest: Some(Box::new(value)),
                            })
                        }
                        JsonSchema::StringWithFormat(_)
                        | JsonSchema::StringFormatExtends(_)
                        | JsonSchema::Number => {
                            let value = items[1].clone();
                            Ok(JsonSchema::MappedRecord {
                                key,
                                rest: Box::new(value),
                            })
                        }
                        _ => {
                            let res = self.collect_consts_from_union(*key);
                            match res {
                                Ok(string_keys) => {
                                    let value = items[1].clone();
                                    Ok(JsonSchema::Object {
                                        vs: string_keys
                                            .into_iter()
                                            .map(|it| (it, value.clone().required()))
                                            .collect(),
                                        rest: None,
                                    })
                                }
                                Err(e) => self.error(span, e),
                            }
                        }
                    }
                }
                None => self
                    .cannot_serialize_error(span, DiagnosticInfoMessage::MissingArgumentsOnRecord),
            },
            TsBuiltIn::TsPick(span) => match type_args {
                Some(vs) => {
                    let items = vs
                        .params
                        .iter()
                        .map(|it| self.convert_ts_type(it))
                        .collect::<Res<Vec<_>>>()?;

                    if items.len() != 2 {
                        return self
                            .error(span, DiagnosticInfoMessage::PickShouldHaveTwoTypeArguments);
                    }
                    let obj = items[0].clone();
                    let k = items[1].clone();
                    let vs = self.extract_object(&obj, span)?;
                    self.convert_pick(span, &vs, k)
                }
                None => {
                    self.cannot_serialize_error(span, DiagnosticInfoMessage::MissingArgumentsOnPick)
                }
            },
            TsBuiltIn::TsOmit(span) => match type_args {
                Some(vs) => {
                    let items = vs
                        .params
                        .iter()
                        .map(|it| self.convert_ts_type(it))
                        .collect::<Res<Vec<_>>>()?;

                    if items.len() != 2 {
                        return self
                            .error(span, DiagnosticInfoMessage::OmitShouldHaveTwoTypeArguments);
                    }
                    let obj = items[0].clone();
                    let k = items[1].clone();
                    let vs = self.extract_object(&obj, span)?;
                    self.convert_omit(span, &vs, k)
                }
                None => {
                    self.cannot_serialize_error(span, DiagnosticInfoMessage::MissingArgumentsOnOmit)
                }
            },
            TsBuiltIn::TsRequired(span) => match type_args {
                Some(vs) => {
                    let items = vs
                        .params
                        .iter()
                        .map(|it| self.convert_ts_type(it))
                        .collect::<Res<Vec<_>>>()?;

                    if items.len() != 1 {
                        return self
                            .error(span, DiagnosticInfoMessage::OmitShouldHaveTwoTypeArguments);
                    }
                    let obj = items[0].clone();
                    let vs = self.extract_object(&obj, span)?;
                    Ok(self.convert_required(&vs))
                }
                None => self.cannot_serialize_error(
                    span,
                    DiagnosticInfoMessage::MissingArgumentsOnRequired,
                ),
            },
            TsBuiltIn::TsPartial(span) => match type_args {
                Some(vs) => {
                    let items = vs
                        .params
                        .iter()
                        .map(|it| self.convert_ts_type(it))
                        .collect::<Res<Vec<_>>>()?;

                    if items.len() != 1 {
                        return self.error(
                            span,
                            DiagnosticInfoMessage::PartialShouldHaveOneTypeArgument,
                        );
                    }
                    let obj = items[0].clone();
                    let vs = self.extract_object(&obj, span)?;
                    Ok(self.convert_partial(&vs))
                }
                None => self
                    .cannot_serialize_error(span, DiagnosticInfoMessage::MissingArgumentsOnPartial),
            },
            TsBuiltIn::TsExclude(span) => match type_args {
                Some(vs) => {
                    let items = vs
                        .params
                        .iter()
                        .map(|it| self.convert_ts_type(it))
                        .collect::<Res<Vec<_>>>()?;
                    if items.len() != 2 {
                        return self.error(
                            span,
                            DiagnosticInfoMessage::ExcludeShouldHaveTwoTypeArguments,
                        );
                    }
                    let mut ctx = SemTypeContext::new();

                    let left_ty = items[0].clone();

                    let left_st = left_ty
                        .to_sem_type(&self.validators_ref(), &mut ctx)
                        .map_err(|e| {
                            self.box_error(span, DiagnosticInfoMessage::AnyhowError(e.to_string()))
                        })?;

                    let right_ty = items[1].clone();

                    let right_st = right_ty
                        .to_sem_type(&self.validators_ref(), &mut ctx)
                        .map_err(|e| {
                            self.box_error(span, DiagnosticInfoMessage::AnyhowError(e.to_string()))
                        })?;

                    let subtracted_ty = left_st.diff(&right_st);
                    let res = self
                        .convert_sem_type(subtracted_ty, &mut ctx, span)?
                        .remove_nots_of_intersections_and_empty_of_union(
                            &self.validators_ref(),
                            &mut ctx,
                        )
                        .map_err(|e| {
                            self.box_error(span, DiagnosticInfoMessage::AnyhowError(e.to_string()))
                        })?;
                    Ok(res)
                }
                None => self
                    .cannot_serialize_error(span, DiagnosticInfoMessage::MissingArgumentsOnExclude),
            },
        }
    }
    fn convert_enum_decl(&mut self, typ: &TsEnumDecl) -> Res<JsonSchema> {
        let mut values = vec![];

        for member in &typ.members {
            match &member.init {
                Some(init) => {
                    let expr_ty = self.typeof_expr(init, true)?;
                    values.push(expr_ty);
                }
                None => {
                    self.cannot_serialize_error(
                        &typ.span,
                        DiagnosticInfoMessage::EnumMemberNoInit,
                    )?;
                } // None => match &member.id {
                  //     TsEnumMemberId::Ident(ident) => {
                  //         let cons = JsonSchemaConst::String(ident.sym.to_string());
                  //         let cons = JsonSchema::Const(cons);
                  //         values.push(cons);
                  //     }
                  //     TsEnumMemberId::Str(str) => {
                  //         let cons = JsonSchemaConst::String(str.value.to_string());
                  //         let cons = JsonSchema::Const(cons);
                  //         values.push(cons);
                  //     }
                  // },
            }
        }

        Ok(JsonSchema::any_of(values))
    }

    fn convert_interface_extends(&mut self, typ: &Vec<TsExprWithTypeArgs>) -> Res<Vec<JsonSchema>> {
        let mut vs = vec![];

        for it in typ {
            match it.type_args {
                Some(_) => {
                    return self.error(
                        &it.span,
                        DiagnosticInfoMessage::TypeArgsInExtendsUnsupported,
                    )
                }
                None => match it.expr.as_ref() {
                    Expr::Ident(id) => {
                        let id_ty = self.get_type_ref(id, &None)?;
                        vs.push(id_ty);
                    }
                    _ => return self.error(&it.span, DiagnosticInfoMessage::ExtendsShouldBeIdent),
                },
            }
        }

        Ok(vs)
    }

    fn convert_ts_interface_decl(
        &mut self,
        typ: &TsInterfaceDecl,
        type_args: Option<Vec<JsonSchema>>,
    ) -> Res<JsonSchema> {
        let params = typ.type_params.as_ref().map(|it| &it.params);

        let map = self.get_type_params_stack_map(type_args, params)?;

        self.type_param_stack.push(map);

        let r = Ok(JsonSchema::object(
            typ.body
                .body
                .iter()
                .map(|x| self.convert_ts_type_element(x))
                .collect::<Res<_>>()?,
            None,
        ));
        self.type_param_stack.pop();

        if typ.extends.is_empty() {
            r
        } else {
            let ext = self.convert_interface_extends(&typ.extends)?;
            Ok(JsonSchema::all_of(
                ext.into_iter().chain(std::iter::once(r?)).collect(),
            ))
        }
    }

    fn convert_type_export(
        &mut self,
        exported: &SymbolExport,
        from_file: &BffFileName,
        type_args: Option<Vec<JsonSchema>>,
    ) -> Res<JsonSchema> {
        let store_current_file = self.current_file.clone();
        self.current_file = from_file.clone();
        let ty = match exported {
            SymbolExport::TsType {
                ty: alias,
                params,
                original_file,
                ..
            } => {
                let store_current_file = self.current_file.clone();
                self.current_file = original_file.clone();
                let res = self.apply_type_params(type_args, params, alias);
                self.current_file = store_current_file;
                res
            }

            SymbolExport::TsInterfaceDecl {
                decl: int,
                original_file,
                ..
            } => {
                let store_current_file = self.current_file.clone();
                self.current_file = original_file.clone();
                let res = self.convert_ts_interface_decl(int, type_args);
                self.current_file = store_current_file;
                res
            }
            SymbolExport::StarOfOtherFile { .. } => {
                self.error(&exported.span(), DiagnosticInfoMessage::CannotUseStarAsType)
            }
            SymbolExport::SomethingOfOtherFile {
                something: word,
                file: from_file,
                span,
            } => {
                let exported = self
                    .files
                    .get_or_fetch_file(from_file)
                    .and_then(|file| file.symbol_exports.get_type(word, self.files));
                match exported {
                    Some(exported) => {
                        self.convert_type_export(exported.as_ref(), from_file, type_args)
                    }
                    None => self.error(
                        span,
                        DiagnosticInfoMessage::CannotResolveSomethingOfOtherFile(word.to_string()),
                    ),
                }
            }
            SymbolExport::ValueExpr { span, .. } => {
                self.error(span, DiagnosticInfoMessage::FoundValueExpectedType)
            }
            SymbolExport::TsEnumDecl {
                decl,
                original_file,
                ..
            } => {
                let store_current_file = self.current_file.clone();
                self.current_file = original_file.clone();
                let res = self.convert_enum_decl(decl);
                self.current_file = store_current_file;
                res
            }
            SymbolExport::ExprDecl {
                original_file, ty, ..
            } => {
                let store_current_file = self.current_file.clone();
                self.current_file = original_file.clone();
                let res = self.convert_ts_type(ty);
                self.current_file = store_current_file;
                res
            }
        };
        self.current_file = store_current_file;
        ty
    }

    fn get_type_params_stack_map(
        &mut self,
        type_args: Option<Vec<JsonSchema>>,
        params: Option<&Vec<TsTypeParam>>,
    ) -> Res<BTreeMap<String, JsonSchema>> {
        let mut map: BTreeMap<String, JsonSchema> = BTreeMap::new();
        if let Some(params) = params {
            let empty_args = vec![];
            let args_vec = type_args.unwrap_or(empty_args);

            for (idx, param) in params.iter().enumerate() {
                // check if there is a corresponding type arg,
                // use default if there is not

                let param_type = args_vec.get(idx);

                let param_name = param.name.sym.to_string();
                // let param_type = match positional_arg {
                //     Some(arg) => Some(self.convert_ts_type(arg)?),
                //     None => param
                //         .default
                //         .as_ref()
                //         .map(|it| self.convert_ts_type(it))
                //         .transpose()?,
                // };
                match param_type {
                    Some(param_type) => {
                        map.insert(param_name, param_type.clone());
                    }
                    None => {
                        return self.cannot_serialize_error(
                            &param.span,
                            DiagnosticInfoMessage::NoArgumentInTypeApplication,
                        )
                    }
                }
            }
        } else {
            assert!(type_args.is_none());
        }

        Ok(map)
    }

    fn apply_type_params(
        &mut self,
        type_args: Option<Vec<JsonSchema>>,
        decl: &Option<Rc<TsTypeParamDecl>>,
        ty: &TsType,
    ) -> Res<JsonSchema> {
        let params = decl.as_ref().map(|it| &it.params);

        let map = self.get_type_params_stack_map(type_args, params)?;
        self.type_param_stack.push(map);
        let ty = self.convert_ts_type(ty)?;
        self.type_param_stack.pop();
        Ok(ty)
    }

    fn get_type_ref_of_user_identifier(
        &mut self,
        i: &Ident,
        type_args: &Option<Box<TsTypeParamInstantiation>>,
    ) -> Res<JsonSchema> {
        let type_args = type_args
            .as_ref()
            .map(|it| {
                it.params
                    .iter()
                    .map(|it| self.convert_ts_type(it))
                    .collect::<Res<Vec<_>>>()
            })
            .transpose()?;
        match TypeResolver::new(self.files, &self.current_file).resolve_local_type(i)? {
            ResolvedLocalSymbol::TsType(decl, ty) => self.apply_type_params(type_args, &decl, &ty),
            ResolvedLocalSymbol::TsInterfaceDecl(int) => {
                self.convert_ts_interface_decl(&int, type_args)
            }
            ResolvedLocalSymbol::NamedImport {
                exported,
                from_file,
            } => self.convert_type_export(exported.as_ref(), from_file.file_name(), type_args),
            ResolvedLocalSymbol::Star(_)
            | ResolvedLocalSymbol::Expr(_)
            | ResolvedLocalSymbol::SymbolExportDefault(_) => {
                self.error(&i.span, DiagnosticInfoMessage::FoundValueExpectedType)
            }
            ResolvedLocalSymbol::TsEnumDecl(decl) => self.convert_enum_decl(&decl),
            ResolvedLocalSymbol::TsBuiltin(_) => panic!("should be converted earlier"),
        }
    }

    fn insert_definition(&mut self, name: String, schema: JsonSchema) -> Res<JsonSchema> {
        if let Some(Some(v)) = self.components.get(&name) {
            assert_eq!(v.schema, schema);
        }
        self.components.insert(
            name.clone(),
            Some(NamedSchema {
                name: name.clone(),
                schema,
            }),
        );
        Ok(JsonSchema::Ref(name))
    }

    fn get_string_with_format(
        &mut self,
        type_params: &Option<Box<TsTypeParamInstantiation>>,
        span: &Span,
    ) -> Res<JsonSchema> {
        let r = type_params.as_ref().and_then(|it| it.params.split_first());

        if let Some((head, rest)) = r {
            if rest.is_empty() {
                if let TsType::TsLitType(TsLitType {
                    lit: TsLit::Str(Str { value, .. }),
                    ..
                }) = &**head
                {
                    let val_str = value.to_string();
                    if self.settings.string_formats.contains(&val_str) {
                        return Ok(JsonSchema::StringWithFormat(val_str));
                    } else {
                        return self
                            .error(span, DiagnosticInfoMessage::CustomStringIsNotRegistered);
                    }
                }
            }
        }
        self.error(
            span,
            DiagnosticInfoMessage::InvalidUsageOfStringFormatTypeParameter,
        )
    }

    fn get_string_format_base_formats(
        &mut self,
        schema: &JsonSchema,
        span: &Span,
    ) -> Res<Vec<String>> {
        match schema {
            JsonSchema::StringWithFormat(v) => Ok(vec![v.clone()]),
            JsonSchema::StringFormatExtends(vs) => Ok(vs.clone()),
            JsonSchema::Ref(r) => {
                let v = self.components.get(r);

                let v = v.and_then(|it| it.clone());
                if let Some(v) = v {
                    self.get_string_format_base_formats(&v.schema, span)
                } else {
                    self.error(
                        span,
                        DiagnosticInfoMessage::CouldNotFindBaseOfStringFormatExtends,
                    )
                }
            }
            _ => self.error(
                span,
                DiagnosticInfoMessage::BaseOfStringFormatExtendsShouldBeStringFormat,
            ),
        }
    }

    fn get_string_format_extends(
        &mut self,
        type_params: &Option<Box<TsTypeParamInstantiation>>,
        span: &Span,
    ) -> Res<JsonSchema> {
        if let Some(type_params) = type_params {
            if let [base, next_str] = type_params.params.as_slice() {
                if let TsType::TsLitType(TsLitType {
                    lit: TsLit::Str(Str { value, .. }),
                    ..
                }) = &**next_str
                {
                    let next_str = value.to_string();
                    if self.settings.string_formats.contains(&next_str) {
                        let base = self.convert_ts_type(base)?;

                        let mut formats = self.get_string_format_base_formats(&base, span)?;
                        formats.push(next_str);
                        return Ok(JsonSchema::StringFormatExtends(formats));
                    } else {
                        return self
                            .error(span, DiagnosticInfoMessage::CustomStringIsNotRegistered);
                    }
                }
            }
        }
        self.error(
            span,
            DiagnosticInfoMessage::InvalidUsageOfStringFormatExtendsTypeParameter,
        )
    }

    fn get_number_format_base_formats(
        &mut self,
        schema: &JsonSchema,
        span: &Span,
    ) -> Res<Vec<String>> {
        match schema {
            JsonSchema::NumberWithFormat(v) => Ok(vec![v.clone()]),
            JsonSchema::NumberFormatExtends(vs) => Ok(vs.clone()),
            JsonSchema::Ref(r) => {
                let v = self.components.get(r);

                let v = v.and_then(|it| it.clone());
                if let Some(v) = v {
                    self.get_number_format_base_formats(&v.schema, span)
                } else {
                    self.error(
                        span,
                        DiagnosticInfoMessage::CouldNotFindBaseOfNumberFormatExtends,
                    )
                }
            }
            _ => self.error(
                span,
                DiagnosticInfoMessage::BaseOfNumberFormatExtendsShouldBeNumberFormat,
            ),
        }
    }

    fn get_number_format_extends(
        &mut self,
        type_params: &Option<Box<TsTypeParamInstantiation>>,
        span: &Span,
    ) -> Res<JsonSchema> {
        if let Some(type_params) = type_params {
            if let [base, next_str] = type_params.params.as_slice() {
                if let TsType::TsLitType(TsLitType {
                    lit: TsLit::Str(Str { value, .. }),
                    ..
                }) = &**next_str
                {
                    let next_str = value.to_string();
                    if self.settings.number_formats.contains(&next_str) {
                        let base = self.convert_ts_type(base)?;

                        let mut formats = self.get_number_format_base_formats(&base, span)?;
                        formats.push(next_str);
                        return Ok(JsonSchema::NumberFormatExtends(formats));
                    } else {
                        return self
                            .error(span, DiagnosticInfoMessage::CustomNumberIsNotRegistered);
                    }
                }
            }
        }
        self.error(
            span,
            DiagnosticInfoMessage::InvalidUsageOfNumberFormatExtendsTypeParameter,
        )
    }

    fn get_number_with_format(
        &mut self,
        type_params: &Option<Box<TsTypeParamInstantiation>>,
        span: &Span,
    ) -> Res<JsonSchema> {
        let r = type_params.as_ref().and_then(|it| it.params.split_first());

        if let Some((head, rest)) = r {
            if rest.is_empty() {
                if let TsType::TsLitType(TsLitType {
                    lit: TsLit::Str(Str { value, .. }),
                    ..
                }) = &**head
                {
                    let val_str = value.to_string();
                    if self.settings.number_formats.contains(&val_str) {
                        return Ok(JsonSchema::NumberWithFormat(val_str));
                    } else {
                        return self
                            .error(span, DiagnosticInfoMessage::CustomNumberIsNotRegistered);
                    }
                }
            }
        }
        self.error(
            span,
            DiagnosticInfoMessage::InvalidUsageOfNumberFormatTypeParameter,
        )
    }

    fn get_type_ref(
        &mut self,
        i: &Ident,
        type_params: &Option<Box<TsTypeParamInstantiation>>,
    ) -> Res<JsonSchema> {
        for map in self.type_param_stack.iter().rev() {
            if let Some(ty) = map.get(&i.sym.to_string()) {
                if type_params.is_some() {
                    panic!("inner type params should be empty")
                }
                return Ok(ty.clone());
            }
        }

        match i.sym.to_string().as_str() {
            "Date" => return Ok(JsonSchema::Codec(CodecName::ISO8061)),
            "Array" => {
                let type_params = type_params.as_ref().and_then(|it| it.params.split_first());
                if let Some((ty, [])) = type_params {
                    let ty = self.convert_ts_type(ty)?;
                    return Ok(JsonSchema::Array(ty.into()));
                }
                return Ok(JsonSchema::Array(JsonSchema::Any.into()));
            }
            "StringFormat" => return self.get_string_with_format(type_params, &i.span),
            "StringFormatExtends" => return self.get_string_format_extends(type_params, &i.span),
            "NumberFormat" => return self.get_number_with_format(type_params, &i.span),
            "NumberFormatExtends" => return self.get_number_format_extends(type_params, &i.span),
            _ => {}
        }
        if let ResolvedLocalSymbol::TsBuiltin(bt) =
            TypeResolver::new(self.files, &self.current_file).resolve_local_type(i)?
        {
            return self.convert_ts_built_in(&bt, type_params);
        }

        let found = self.components.get(&(i.sym.to_string()));
        if let Some(_found) = found {
            return Ok(JsonSchema::Ref(i.sym.to_string()));
        }
        self.components.insert(i.sym.to_string(), None);

        let ty = self.get_type_ref_of_user_identifier(i, type_params);
        match ty {
            Ok(ty) => {
                if type_params.is_some() {
                    self.components.remove(&i.sym.to_string());
                    Ok(ty)
                } else {
                    self.insert_definition(i.sym.to_string(), ty)
                }
            }
            Err(e) => {
                self.insert_definition(i.sym.to_string(), JsonSchema::Any)?;
                Err(e)
            }
        }
    }

    fn union(&mut self, types: &[Box<TsType>]) -> Res<JsonSchema> {
        let vs: Vec<JsonSchema> = types
            .iter()
            .map(|it| self.convert_ts_type(it))
            .collect::<Res<_>>()?;
        Ok(JsonSchema::any_of(vs))
    }

    fn intersection(&mut self, types: &[Box<TsType>], _span: &Span) -> Res<JsonSchema> {
        let vs: Vec<JsonSchema> = types
            .iter()
            .map(|it| self.convert_ts_type(it))
            .collect::<Res<_>>()?;

        Ok(JsonSchema::all_of(vs))
    }

    fn cannot_serialize_error<T>(&mut self, span: &Span, msg: DiagnosticInfoMessage) -> Res<T> {
        let cause = self.create_error(span, msg);

        match self.ref_stack.split_first() {
            Some((head, tail)) => {
                let mut related_information = tail.to_vec();
                related_information.push(cause);
                Err(Diagnostic {
                    cause: head.clone(),
                    related_information: Some(related_information),
                    parent_big_message: Some(DiagnosticParentMessage::CannotConvertToSchema),
                }
                .into())
            }
            None => Err(Diagnostic {
                parent_big_message: Some(DiagnosticParentMessage::CannotConvertToSchema),
                cause,
                related_information: None,
            }
            .into()),
        }
    }

    fn create_error(&mut self, span: &Span, msg: DiagnosticInfoMessage) -> DiagnosticInformation {
        let file = self.files.get_or_fetch_file(&self.current_file);
        Location::build(file, span, &self.current_file).to_info(msg)
    }
    fn box_error(&mut self, span: &Span, msg: DiagnosticInfoMessage) -> Box<Diagnostic> {
        let err = self.create_error(span, msg);
        err.to_diag(None).into()
    }
    fn error<T>(&mut self, span: &Span, msg: DiagnosticInfoMessage) -> Res<T> {
        Err(self.box_error(span, msg))
    }
    fn get_identifier_diag_info(&mut self, i: &Ident) -> Option<DiagnosticInformation> {
        self.files
            .get_or_fetch_file(&self.current_file)
            .map(|file| {
                let msg = DiagnosticInfoMessage::ThisRefersToSomethingThatCannotBeSerialized(
                    i.sym.to_string(),
                );
                Location::build(Some(file), &i.span, &self.current_file).to_info(msg)
            })
    }

    fn get_qualified_type_from_file(
        &mut self,
        from_file: &Rc<ImportReference>,
        right: &JsWord,
        span: &Span,
    ) -> Res<(Rc<SymbolExport>, Rc<ImportReference>, String)> {
        let exported = self
            .files
            .get_or_fetch_file(from_file.file_name())
            .and_then(|module| module.symbol_exports.get_type(right, self.files));
        match exported {
            Some(exported) => {
                let name = match &*exported {
                    SymbolExport::TsType { name, .. } => name.to_string(),
                    SymbolExport::TsInterfaceDecl { decl: it, .. } => it.id.sym.to_string(),
                    SymbolExport::StarOfOtherFile { .. } => right.to_string(),
                    SymbolExport::SomethingOfOtherFile {
                        something: that, ..
                    } => that.to_string(),
                    SymbolExport::ValueExpr { .. } => {
                        return self.error(span, DiagnosticInfoMessage::FoundValueExpectedType)
                    }
                    SymbolExport::TsEnumDecl { decl, .. } => decl.id.sym.to_string(),
                    SymbolExport::ExprDecl { span, .. } => {
                        return self
                            .error(span, DiagnosticInfoMessage::CannotUseExprDeclAsQualified)
                    }
                };
                Ok((exported, from_file.clone(), name))
            }
            None => self.error(
                span,
                DiagnosticInfoMessage::CannotGetQualifiedTypeFromFile(right.to_string()),
            ),
        }
    }

    fn recursively_get_qualified_type_export(
        &mut self,
        exported: Rc<SymbolExport>,
        right: &Ident,
    ) -> Res<(Rc<SymbolExport>, Rc<ImportReference>, String)> {
        match &*exported {
            SymbolExport::TsType { .. } => self.error(
                &right.span,
                DiagnosticInfoMessage::CannotUseTsTypeAsQualified,
            ),
            SymbolExport::TsInterfaceDecl { .. } => self.error(
                &right.span,
                DiagnosticInfoMessage::CannotUseTsInterfaceAsQualified,
            ),
            SymbolExport::StarOfOtherFile {
                reference: other_file,
                ..
            } => self.get_qualified_type_from_file(other_file, &right.sym, &right.span),
            SymbolExport::SomethingOfOtherFile {
                something: word,
                file: from_file,
                ..
            } => {
                let exported = self
                    .files
                    .get_or_fetch_file(from_file)
                    .and_then(|module| module.symbol_exports.get_type(word, self.files));

                match exported {
                    Some(exported) => self.recursively_get_qualified_type_export(exported, right),
                    None => self.error(
                        &right.span,
                        DiagnosticInfoMessage::CannotGetQualifiedTypeFromFileRec(
                            right.sym.to_string(),
                        ),
                    ),
                }
            }
            SymbolExport::ValueExpr { span, .. } => {
                self.error(span, DiagnosticInfoMessage::FoundValueExpectedType)
            }
            SymbolExport::TsEnumDecl { span, .. } => {
                self.error(span, DiagnosticInfoMessage::CannotUseTsEnumAsQualified)
            }
            SymbolExport::ExprDecl { span, .. } => {
                self.error(span, DiagnosticInfoMessage::CannotUseExprDeclAsQualified)
            }
        }
    }
    fn __convert_ts_type_qual_inner(
        &mut self,
        q: &TsQualifiedName,
    ) -> Res<(Rc<SymbolExport>, Rc<ImportReference>, String)> {
        match &q.left {
            TsEntityName::TsQualifiedName(q2) => {
                let (exported, _from_file, _name) = self.__convert_ts_type_qual_inner(q2)?;
                self.recursively_get_qualified_type_export(exported, &q.right)
            }
            TsEntityName::Ident(i) => {
                let ns = TypeResolver::new(self.files, &self.current_file)
                    .resolve_namespace_symbol(i, true)?;
                self.get_qualified_type_from_file(&ns.from_file, &q.right.sym, &q.right.span)
            }
        }
    }

    fn __convert_ts_type_qual_caching(
        &mut self,
        q: &TsQualifiedName,
        type_args: &Option<Box<TsTypeParamInstantiation>>,
    ) -> Res<JsonSchema> {
        match &q.left {
            TsEntityName::TsQualifiedName(_) => {}
            TsEntityName::Ident(i) => {
                let ns = TypeResolver::new(self.files, &self.current_file)
                    .resolve_namespace_symbol(i, true);
                if let Ok(resolved) = ns {
                    match resolved.from_file.as_ref() {
                        ImportReference::Named {
                            orig, file_name, ..
                        } => {
                            let from_file =
                                self.files.get_or_fetch_file(file_name).and_then(|module| {
                                    module.symbol_exports.get_type(orig, self.files)
                                });

                            if let Some(symbol_export) = from_file {
                                if let SymbolExport::TsEnumDecl {
                                    decl,
                                    span,
                                    original_file,
                                } = symbol_export.as_ref()
                                {
                                    let found = decl.members.iter().find(|it| match &it.id {
                                        TsEnumMemberId::Ident(i2) => i2.sym == q.right.sym,
                                        TsEnumMemberId::Str(_) => unreachable!(),
                                    });
                                    return match found {
                                        Some(item) => match &item.init {
                                            Some(init) => {
                                                let expr_ty = {
                                                    let store_current_file =
                                                        self.current_file.clone();
                                                    self.current_file = original_file.clone();
                                                    let out = self.typeof_expr(init, true);
                                                    self.current_file = store_current_file;
                                                    out?
                                                };
                                                Ok(expr_ty)
                                            }
                                            None => self.cannot_serialize_error(
                                                span,
                                                DiagnosticInfoMessage::EnumMemberNoInit,
                                            ),
                                        },
                                        None => self.cannot_serialize_error(
                                            span,
                                            DiagnosticInfoMessage::EnumMemberNoInit,
                                        ),
                                    };
                                }
                            }
                        }
                        ImportReference::Star { .. } => {}
                        ImportReference::Default { .. } => {}
                    }
                }
            }
        }

        let found = self.components.get(&(q.right.sym.to_string()));
        if let Some(_found) = found {
            return Ok(JsonSchema::Ref(q.right.sym.to_string()));
        }

        let (exported, from_file, name) = self.__convert_ts_type_qual_inner(q)?;

        let type_args_schema = type_args
            .as_ref()
            .map(|it| {
                it.params
                    .iter()
                    .map(|it| self.convert_ts_type(it))
                    .collect::<Res<Vec<_>>>()
            })
            .transpose()?;

        let ty =
            self.convert_type_export(exported.as_ref(), from_file.file_name(), type_args_schema)?;
        if type_args.is_some() {
            self.components.remove(&name);
            Ok(ty)
        } else {
            self.insert_definition(name, ty)
        }
    }
    fn convert_ts_type_qual(
        &mut self,
        q: &TsQualifiedName,
        type_args: &Option<Box<TsTypeParamInstantiation>>,
    ) -> Res<JsonSchema> {
        match &q.left {
            TsEntityName::TsQualifiedName(_) => {}
            TsEntityName::Ident(i) => {
                let k = &(i.sym.clone(), i.span.ctxt);
                let local_enum = self
                    .files
                    .get_existing_file(&self.current_file)
                    .and_then(|current_file| current_file.locals.enums.get(k).cloned());
                if let Some(local) = local_enum {
                    let found = local.members.iter().find(|it| match &it.id {
                        TsEnumMemberId::Ident(i2) => i2.sym == q.right.sym,
                        TsEnumMemberId::Str(_) => unreachable!(),
                    });

                    return match &found.as_ref().and_then(|it| it.init.clone()) {
                        Some(init) => {
                            let expr_ty = self.typeof_expr(init, true)?;
                            Ok(expr_ty)
                        }
                        None => self.cannot_serialize_error(
                            &q.right.span,
                            DiagnosticInfoMessage::EnumMemberNoInit,
                        ),
                    };
                }
            }
        };

        let current_ref = self.get_identifier_diag_info(&q.right);
        let did_push = current_ref.is_some();
        if let Some(current_ref) = current_ref {
            self.ref_stack.push(current_ref);
        }
        let v = self.__convert_ts_type_qual_caching(q, type_args);
        if did_push {
            self.ref_stack.pop();
        }
        v
    }
    fn convert_ts_type_ident(
        &mut self,
        i: &Ident,
        type_params: &Option<Box<TsTypeParamInstantiation>>,
    ) -> Res<JsonSchema> {
        let current_ref = self.get_identifier_diag_info(i);
        let did_push = current_ref.is_some();
        if let Some(current_ref) = current_ref {
            self.ref_stack.push(current_ref);
        }
        let v = self.get_type_ref(i, type_params);
        if did_push {
            self.ref_stack.pop();
        }
        v
    }

    pub fn typeof_expr(&mut self, e: &Expr, as_const: bool) -> Res<JsonSchema> {
        match e {
            Expr::Tpl(s) => {
                if as_const {
                    let mut acc: Vec<TplLitTypeItem> = vec![];

                    for it in &s.exprs {
                        let ty = match it.as_ref() {
                            Expr::Call(_) => Ok(JsonSchema::String),
                            _ => self.typeof_expr(it, as_const),
                        }?;
                        let res = self.json_schema_to_tpl_lit(&it.span(), &ty)?;
                        acc.push(res);
                    }

                    Ok(JsonSchema::TplLitType(acc))
                } else {
                    Ok(JsonSchema::String)
                }
            }
            Expr::Lit(l) => match l {
                Lit::Str(s) => {
                    if as_const {
                        Ok(JsonSchema::Const(JsonSchemaConst::String(
                            s.value.to_string(),
                        )))
                    } else {
                        Ok(JsonSchema::String)
                    }
                }
                Lit::Bool(b) => {
                    if as_const {
                        Ok(JsonSchema::Const(JsonSchemaConst::Bool(b.value)))
                    } else {
                        Ok(JsonSchema::Boolean)
                    }
                }
                Lit::Null(_) => Ok(JsonSchema::Null),
                Lit::Num(n) => {
                    if as_const {
                        Ok(JsonSchema::Const(JsonSchemaConst::parse_f64(n.value)))
                    } else {
                        Ok(JsonSchema::Number)
                    }
                }
                Lit::BigInt(_) => Ok(JsonSchema::Codec(CodecName::BigInt)),
                Lit::Regex(_) => {
                    self.error(&e.span(), DiagnosticInfoMessage::TypeOfRegexNotSupported)
                }
                Lit::JSXText(_) => {
                    self.error(&e.span(), DiagnosticInfoMessage::TypeOfJSXTextNotSupported)
                }
            },
            Expr::Array(lit) => {
                let mut prefix_items = vec![];
                for it in lit.elems.iter().flatten() {
                    match it.spread {
                        Some(span) => {
                            let ty_schema = self.typeof_expr(&it.expr, as_const)?;

                            match self.extract_tuple(ty_schema.clone(), span) {
                                Ok(vs) => {
                                    prefix_items.extend(vs);
                                }
                                Err(_) => {
                                    let inner_schema = self.extract_array(ty_schema, span)?;
                                    prefix_items.push(inner_schema);
                                }
                            }
                        }
                        None => {
                            let ty_schema = self.typeof_expr(&it.expr, as_const)?;
                            prefix_items.push(ty_schema);
                        }
                    }
                }
                Ok(JsonSchema::Tuple {
                    prefix_items,
                    items: None,
                })
            }
            Expr::Object(lit) => {
                let mut vs = BTreeMap::new();

                for it in &lit.props {
                    match it {
                        PropOrSpread::Spread(sp) => {
                            let spread_ty = self.typeof_expr(&sp.expr, as_const)?;

                            if let JsonSchema::Object { vs: spread_vs, .. } = spread_ty {
                                for (k, v) in spread_vs {
                                    vs.insert(k, v);
                                }
                            } else {
                                return self.error(
                                    &it.span(),
                                    DiagnosticInfoMessage::TypeofObjectUnsupportedSpread,
                                );
                            }
                        }
                        PropOrSpread::Prop(p) => match p.as_ref() {
                            Prop::KeyValue(p) => {
                                let key: String = match &p.key {
                                    PropName::Ident(id) => id.sym.to_string(),
                                    PropName::Str(st) => st.value.to_string(),
                                    PropName::Num(_) => {
                                        return self.error(
                                            &p.key.span(),
                                            DiagnosticInfoMessage::TypeofObjectUnsupportedPropNum,
                                        )
                                    }
                                    PropName::Computed(_) => return self.error(
                                        &p.key.span(),
                                        DiagnosticInfoMessage::TypeofObjectUnsupportedPropComputed,
                                    ),
                                    PropName::BigInt(_) => return self.error(
                                        &p.key.span(),
                                        DiagnosticInfoMessage::TypeofObjectUnsupportedPropBigInt,
                                    ),
                                };
                                let value = self.typeof_expr(&p.value, as_const)?;
                                vs.insert(key, value.required());
                            }
                            Prop::Shorthand(p) => {
                                let key: String = p.sym.to_string();
                                let value = self.typeof_expr(&Expr::Ident(p.clone()), as_const)?;
                                vs.insert(key, value.required());
                            }
                            Prop::Assign(_)
                            | Prop::Getter(_)
                            | Prop::Setter(_)
                            | Prop::Method(_) => {
                                return self.error(
                                    &p.span(),
                                    DiagnosticInfoMessage::TypeofObjectUnsupportedProp,
                                )
                            }
                        },
                    }
                }

                Ok(JsonSchema::Object { vs, rest: None })
            }
            Expr::Ident(i) => {
                let s = TypeResolver::new(self.files, &self.current_file).resolve_local_value(i)?;
                self.typeof_symbol(s, &i.span)
            }
            Expr::TsConstAssertion(c) => self.typeof_expr(&c.expr, true),
            Expr::TsSatisfies(c) => self.typeof_expr(&c.expr, as_const),
            Expr::Member(m) => {
                let mut ctx = SemTypeContext::new();
                let k = match &m.prop {
                    MemberProp::Ident(i) => Some(i.sym.to_string()),
                    MemberProp::Computed(c) => match self.typeof_expr(&c.expr, as_const)? {
                        JsonSchema::Const(JsonSchemaConst::String(s)) => Some(s.clone()),
                        _ => None,
                    },
                    MemberProp::PrivateName(_) => None,
                };
                if let Some(key) = &k {
                    let from_enum = if let Expr::Ident(i) = &m.obj.as_ref() {
                        if let Ok(decl) = TypeResolver::new(self.files, &self.current_file)
                            .resolve_namespace_symbol(i, false)
                        {
                            match decl.from_file.as_ref() {
                                ImportReference::Named {
                                    orig,
                                    file_name,
                                    span,
                                } => {
                                    let Some(from_file) = self
                                        .files
                                        .get_or_fetch_file(file_name)
                                        .and_then(|module| {
                                            module.symbol_exports.get_type(orig, self.files)
                                        })
                                    else {
                                        return self.error(
                                            span,
                                            DiagnosticInfoMessage::CannotResolveNamedImport,
                                        );
                                    };
                                    match from_file.as_ref() {
                                        SymbolExport::TsEnumDecl { decl, .. } => Some(decl.clone()),
                                        _ => {
                                            return self.error(
                                                span,
                                                DiagnosticInfoMessage::CannotResolveNamedImport,
                                            );
                                        }
                                    }
                                }
                                ImportReference::Star { .. } => {
                                    return self.error(
                                        &i.span,
                                        DiagnosticInfoMessage::CannotResolveNamedImport,
                                    );
                                }
                                ImportReference::Default { .. } => {
                                    return self.error(
                                        &i.span,
                                        DiagnosticInfoMessage::CannotResolveNamedImport,
                                    );
                                }
                            }
                        } else if let Ok(ResolvedLocalSymbol::TsEnumDecl(decl)) =
                            TypeResolver::new(self.files, &self.current_file).resolve_local_value(i)
                        {
                            Some(decl)
                        } else {
                            None
                        }
                    } else {
                        None
                    };
                    if let Some(from_enum) = from_enum {
                        if !as_const {
                            return self.convert_enum_decl(&from_enum);
                        }
                        let Some(enum_value) = from_enum.members.iter().find(|it| match &it.id {
                            TsEnumMemberId::Ident(i) => i.sym == *key,
                            TsEnumMemberId::Str(_) => unreachable!(),
                        }) else {
                            return self
                                .error(&m.prop.span(), DiagnosticInfoMessage::EnumMemberNotFound);
                        };
                        let Some(init) = &enum_value.init else {
                            return self
                                .error(&m.prop.span(), DiagnosticInfoMessage::EnumMemberNoInit);
                        };

                        return self.typeof_expr(init, true);
                    }
                }
                let obj = self.typeof_expr(&m.obj, as_const)?;
                if let Some(key) = k {
                    if let JsonSchema::Object { vs, rest: _ } = &obj {
                        // try to do it syntatically to preserve aliases
                        if let Some(Optionality::Required(v)) = vs.get(&key) {
                            return Ok(v.clone());
                        };
                    }
                }
                // fall back to semantic types if it cannot be done syntatically
                let key: Rc<SemType> = match &m.prop {
                    MemberProp::Ident(i) => Rc::new(SemTypeContext::string_const(
                        StringLitOrFormat::Lit(i.sym.to_string()),
                    )),
                    MemberProp::PrivateName(_) => {
                        return self.error(
                            &m.prop.span(),
                            DiagnosticInfoMessage::TypeofPrivateNameNotSupported,
                        )
                    }
                    MemberProp::Computed(c) => {
                        let v = self.typeof_expr(&c.expr, as_const)?;
                        v.to_sem_type(&self.validators_ref(), &mut ctx)
                            .map_err(|e| {
                                self.box_error(
                                    &m.span,
                                    DiagnosticInfoMessage::AnyhowError(e.to_string()),
                                )
                            })?
                    }
                };
                let st = obj
                    .to_sem_type(&self.validators_ref(), &mut ctx)
                    .map_err(|e| {
                        self.box_error(&m.span, DiagnosticInfoMessage::AnyhowError(e.to_string()))
                    })?;
                let access_st: Rc<SemType> = ctx.indexed_access(st, key).map_err(|e| {
                    self.box_error(&m.span, DiagnosticInfoMessage::AnyhowError(e.to_string()))
                })?;
                self.convert_sem_type(access_st, &mut ctx, &m.prop.span())
            }
            Expr::Arrow(_a) => Ok(JsonSchema::Function),
            Expr::Bin(e) => {
                let left = self.typeof_expr(&e.left, as_const)?;
                let right = self.typeof_expr(&e.right, as_const)?;

                match (left, right) {
                    (JsonSchema::Number, JsonSchema::Number) => Ok(JsonSchema::Number),
                    (JsonSchema::String, JsonSchema::String) => Ok(JsonSchema::String),
                    _ => self.error(&e.span(), DiagnosticInfoMessage::CannotConvertExprToSchema),
                }
            }
            _ => {
                dbg!(&e);
                self.error(&e.span(), DiagnosticInfoMessage::CannotConvertExprToSchema)
            }
        }
    }

    fn typeof_symbol_export(
        &mut self,
        exported: Rc<SymbolExport>,
        from_file: Rc<ImportReference>,
    ) -> Res<JsonSchema> {
        let old_file = self.current_file.clone();
        self.current_file = from_file.file_name().clone();
        let ty = match exported.as_ref() {
            SymbolExport::TsEnumDecl { decl, .. } => return self.convert_enum_decl(decl),
            SymbolExport::TsType { .. } | SymbolExport::TsInterfaceDecl { .. } => self.error(
                &exported.span(),
                DiagnosticInfoMessage::FoundTypeExpectedValueInSymbolExport,
            ),
            SymbolExport::ValueExpr { expr, .. } => self.typeof_expr(expr, false),
            SymbolExport::StarOfOtherFile { .. } => self.error(
                &exported.span(),
                DiagnosticInfoMessage::TypeOfStarNotSupported,
            ),
            SymbolExport::SomethingOfOtherFile { .. } => self.error(
                &exported.span(),
                DiagnosticInfoMessage::TypeOfSomethingOfOtherFileNotSupported,
            ),
            SymbolExport::ExprDecl { ty, .. } => self.convert_ts_type(ty),
        };
        self.current_file = old_file;
        ty
    }

    fn collect_value_exports(
        &mut self,
        file_name: &BffFileName,
        acc: &mut Vec<(String, Optionality<JsonSchema>)>,
    ) -> Res<()> {
        let store_current_file = self.current_file.clone();
        self.current_file = file_name.clone();
        // We must not use "?" if doing current file update, otherwise we get lost on errors
        let out = self.collect_value_exports_no_curr_file_update____(file_name, acc);
        self.current_file = store_current_file;
        out
    }
    fn collect_value_exports_no_curr_file_update____(
        &mut self,
        file_name: &BffFileName,
        acc: &mut Vec<(String, Optionality<JsonSchema>)>,
    ) -> Res<()> {
        let file = self.files.get_or_fetch_file(file_name);
        if let Some(pm) = file {
            for (k, v) in &pm.symbol_exports.named_values {
                match v.as_ref() {
                    SymbolExport::TsEnumDecl { .. }
                    | SymbolExport::TsType { .. }
                    | SymbolExport::TsInterfaceDecl { .. } => {}
                    SymbolExport::ValueExpr { expr, name: _, .. } => {
                        let ty = self.typeof_expr(expr, false)?;
                        acc.push((k.to_string(), ty.required()));
                    }
                    SymbolExport::StarOfOtherFile { reference, .. } => match reference.as_ref() {
                        ImportReference::Named { .. } => {
                            return self
                                .error(&v.span(), DiagnosticInfoMessage::CannotUseNamedAsStar)
                        }
                        ImportReference::Star { file_name, .. } => {
                            let mut acc2 = vec![];
                            self.collect_value_exports(file_name, &mut acc2)?;
                            let v = JsonSchema::object(acc2, None);
                            acc.push((k.to_string(), v.required()));
                        }
                        ImportReference::Default { .. } => {
                            return self
                                .error(&v.span(), DiagnosticInfoMessage::CannotUseDefaultAsStar)
                        }
                    },
                    SymbolExport::SomethingOfOtherFile {
                        file,
                        something,
                        span,
                    } => {
                        let mut acc2 = vec![];
                        self.collect_value_exports(file, &mut acc2)?;
                        let found = acc2.iter().find(|(k, _)| k == &something.to_string());
                        match found {
                            Some((_, found)) => {
                                acc.push((k.to_string(), found.clone()));
                            }
                            None => {
                                return self.error(
                                    span,
                                    DiagnosticInfoMessage::CouldNotFindSomethingOfOtherFile(
                                        something.to_string(),
                                    ),
                                )
                            }
                        }
                    }
                    SymbolExport::ExprDecl { name, ty, .. } => {
                        acc.push((name.to_string(), self.convert_ts_type(ty)?.required()));
                    }
                }
            }
            for f in &pm.symbol_exports.extends {
                self.collect_value_exports(f, acc)?;
            }
        }

        Ok(())
    }

    pub fn typeof_symbol(&mut self, s: ResolvedLocalSymbol, span: &Span) -> Res<JsonSchema> {
        match s {
            ResolvedLocalSymbol::TsType(_, _) | ResolvedLocalSymbol::TsInterfaceDecl(_) => {
                self.error(span, DiagnosticInfoMessage::FoundTypeExpectedValue)
            }
            ResolvedLocalSymbol::Expr(e) => self.typeof_expr(&e, false),
            ResolvedLocalSymbol::NamedImport {
                exported,
                from_file,
            } => self.typeof_symbol_export(exported, from_file),
            ResolvedLocalSymbol::SymbolExportDefault(e) => self.typeof_expr(&e.symbol_export, true),
            ResolvedLocalSymbol::Star(file_name) => {
                let mut acc = vec![];
                self.collect_value_exports(&file_name, &mut acc)?;
                Ok(JsonSchema::object(acc, None))
            }
            ResolvedLocalSymbol::TsEnumDecl(enum_decl) => self.convert_enum_decl(&enum_decl),
            ResolvedLocalSymbol::TsBuiltin(_) => {
                self.error(span, DiagnosticInfoMessage::TypeOfTsBuiltinNotSupported)
            }
        }
    }
    fn get_kv_from_schema(&mut self, schema: JsonSchema, key: &str, span: Span) -> Res<JsonSchema> {
        if let JsonSchema::Object { vs: kvs, rest: _ } = schema {
            if let Some(Optionality::Required(v)) = kvs.get(key) {
                return Ok(v.clone());
            }
        }
        self.error(
            &span,
            DiagnosticInfoMessage::CannotResolveKey(key.to_string()),
        )
    }
    fn convert_type_query_qualified(&mut self, q: &TsQualifiedName) -> Res<JsonSchema> {
        match &q.left {
            TsEntityName::TsQualifiedName(q) => {
                let t = self.convert_type_query_qualified(q)?;
                self.get_kv_from_schema(t, q.right.sym.as_ref(), q.right.span())
            }
            TsEntityName::Ident(id) => {
                let s =
                    TypeResolver::new(self.files, &self.current_file).resolve_local_value(id)?;
                let t = self.typeof_symbol(s, &q.left.span())?;
                self.get_kv_from_schema(t, q.right.sym.as_ref(), q.right.span())
            }
        }
    }

    pub fn convert_type_query(&mut self, q: &TsTypeQuery) -> Res<JsonSchema> {
        if q.type_args.is_some() {
            return self.error(&q.span, DiagnosticInfoMessage::TypeQueryArgsNotSupported);
        }
        match q.expr_name {
            TsTypeQueryExpr::Import(ref imp) => {
                self.error(&imp.span, DiagnosticInfoMessage::TypeofImportNotSupported)
            }
            TsTypeQueryExpr::TsEntityName(ref n) => match n {
                TsEntityName::TsQualifiedName(q) => self.convert_type_query_qualified(q),
                TsEntityName::Ident(n) => {
                    if let Some(f) = self.files.get_or_fetch_file(&self.current_file) {
                        let k = &(n.sym.clone(), n.span.ctxt);
                        if let Some(expr_decl) = f.locals.exprs_decls.get(k) {
                            return self.convert_ts_type(expr_decl);
                        }

                        if let Some(exported) = f.symbol_exports.named_values.get(&n.sym) {
                            if let SymbolExport::ExprDecl { ty, .. } = exported.as_ref() {
                                return self.convert_ts_type(ty);
                            }
                        }
                    }
                    let s =
                        TypeResolver::new(self.files, &self.current_file).resolve_local_value(n)?;
                    self.typeof_symbol(s, &n.span)
                }
            },
        }
    }
    fn validators_ref(&self) -> Vec<&NamedSchema> {
        self.components
            .values()
            .filter_map(|it| it.as_ref())
            .collect()
    }

    fn convert_sem_type(
        &mut self,
        access_st: Rc<SemType>,
        ctx: &mut SemTypeContext,
        span: &Span,
    ) -> Res<JsonSchema> {
        if access_st.is_empty(ctx) {
            return Ok(JsonSchema::StNever);
        }
        let (head, tail) =
            to_validators(ctx, &access_st, "AnyName", self.counter).map_err(|any| {
                self.box_error(span, DiagnosticInfoMessage::AnyhowError(any.to_string()))
            })?;
        for t in tail {
            self.insert_definition(t.name.clone(), t.schema)?;
        }
        Ok(head.schema)
    }
    fn convert_indexed_access_syntatically(
        &mut self,
        obj: &JsonSchema,
        index: &JsonSchema,
    ) -> Res<Option<JsonSchema>> {
        // try to resolve syntatically
        match (obj, index) {
            (JsonSchema::Ref(r), _) => {
                let v = self.components.get(r);

                let v = v.and_then(|it| it.clone());
                if let Some(v) = v {
                    return self.convert_indexed_access_syntatically(&v.schema, index);
                }
            }
            (JsonSchema::Object { vs, rest: _ }, JsonSchema::Const(JsonSchemaConst::String(s))) => {
                let v = vs.get(s);
                if let Some(Optionality::Required(v)) = v {
                    return Ok(Some(v.clone()));
                }
            }
            _ => {}
        }
        Ok(None)
    }
    fn convert_indexed_access(&mut self, i: &TsIndexedAccessType) -> Res<JsonSchema> {
        let obj = self.convert_ts_type(&i.obj_type)?;
        let index = self.convert_ts_type(&i.index_type)?;

        if let Some(res) = self.convert_indexed_access_syntatically(&obj, &index)? {
            return Ok(res);
        }
        // fallback to semantic
        let mut ctx = SemTypeContext::new();

        let obj_st = obj
            .to_sem_type(&self.validators_ref(), &mut ctx)
            .map_err(|e| {
                self.box_error(&i.span, DiagnosticInfoMessage::AnyhowError(e.to_string()))
            })?;
        let idx_st = index
            .to_sem_type(&self.validators_ref(), &mut ctx)
            .map_err(|e| {
                self.box_error(&i.span, DiagnosticInfoMessage::AnyhowError(e.to_string()))
            })?;

        let access_st: Rc<SemType> = ctx.indexed_access(obj_st, idx_st).map_err(|e| {
            self.box_error(&i.span, DiagnosticInfoMessage::AnyhowError(e.to_string()))
        })?;
        self.convert_sem_type(access_st, &mut ctx, &i.span())
    }
    fn convert_keyof(&mut self, k: &TsType) -> Res<JsonSchema> {
        let json_schema = self.convert_ts_type(k)?;
        let mut ctx = SemTypeContext::new();
        let st = json_schema
            .to_sem_type(&self.validators_ref(), &mut ctx)
            .map_err(|e| {
                self.box_error(&k.span(), DiagnosticInfoMessage::AnyhowError(e.to_string()))
            })?;

        let keyof_st: Rc<SemType> = ctx.keyof(st).map_err(|e| {
            self.box_error(&k.span(), DiagnosticInfoMessage::AnyhowError(e.to_string()))
        })?;

        self.convert_sem_type(keyof_st, &mut ctx, &k.span())
    }

    fn extract_union(&self, tp: JsonSchema) -> Result<Vec<JsonSchema>, DiagnosticInfoMessage> {
        match tp {
            JsonSchema::AnyOf(v) => {
                let mut vs = vec![];
                for item in v {
                    let extracted = self.extract_union(item)?;
                    vs.extend(extracted);
                }
                Ok(vs)
            }
            JsonSchema::Ref(r) => {
                let v = self.components.get(&r);
                let v = v.and_then(|it| it.clone());
                match v {
                    Some(v) => self.extract_union(v.schema),
                    None => Err(DiagnosticInfoMessage::CannotResolveRefInExtractUnion(
                        r.to_string(),
                    )),
                }
            }
            _ => Ok(vec![tp]),
        }
    }

    fn convert_mapped_type(&mut self, k: &TsMappedType) -> Res<JsonSchema> {
        let name = k.type_param.name.sym.to_string();
        let constraint = match k.type_param.constraint {
            Some(ref it) => it.as_ref(),
            None => {
                return self.error(
                    &k.type_param.span,
                    DiagnosticInfoMessage::NoConstraintInMappedType,
                )
            }
        };
        let constraint_schema = self.convert_ts_type(constraint)?;
        let values = self
            .extract_union(constraint_schema)
            .map_err(|e| self.box_error(&constraint.span(), e))?;

        let mut string_keys = vec![];

        for v in values {
            match v {
                JsonSchema::Const(JsonSchemaConst::String(s)) => {
                    string_keys.push(s);
                }
                _ => return self.error(&k.span, DiagnosticInfoMessage::NonStringKeyInMappedType),
            }
        }

        let type_ann = match &k.type_ann {
            Some(ref type_ann) => type_ann.as_ref(),
            None => {
                return self.error(&k.span, DiagnosticInfoMessage::NoTypeAnnotationInMappedType)
            }
        };

        let mut vs = vec![];
        for key in string_keys.into_iter() {
            self.type_param_stack.push(BTreeMap::from_iter(vec![(
                name.clone(),
                JsonSchema::Const(JsonSchemaConst::String(key.clone())),
            )]));
            let ty = self.convert_ts_type(type_ann)?;
            self.type_param_stack.pop();

            let ty = match k.optional {
                Some(opt) => match opt {
                    TruePlusMinus::True => Optionality::Optional(ty),
                    TruePlusMinus::Plus => Optionality::Required(ty),
                    TruePlusMinus::Minus => {
                        return self
                            .error(&k.span, DiagnosticInfoMessage::MappedTypeMinusNotSupported)
                    }
                },
                None => Optionality::Required(ty),
            };
            vs.push((key, ty));
        }

        Ok(JsonSchema::object(vs, None))
    }

    fn json_schema_to_tpl_lit(&mut self, span: &Span, schema: &JsonSchema) -> Res<TplLitTypeItem> {
        match schema {
            JsonSchema::Boolean => Ok(TplLitTypeItem::Boolean),
            JsonSchema::String => Ok(TplLitTypeItem::String),
            JsonSchema::Number => Ok(TplLitTypeItem::Number),
            JsonSchema::Const(JsonSchemaConst::String(txt)) => {
                Ok(TplLitTypeItem::StringConst(txt.to_string()))
            }
            JsonSchema::AnyOf(vs) => {
                let mut acc = vec![];
                for v in vs {
                    let item = self.json_schema_to_tpl_lit(span, v)?;
                    acc.push(item);
                }
                Ok(TplLitTypeItem::one_of(acc))
            }
            JsonSchema::Ref(name) => {
                let v = self.components.get(name);
                let v = v.and_then(|it| it.clone());
                match v {
                    Some(v) => self.json_schema_to_tpl_lit(span, &v.schema),
                    None => self.error(
                        span,
                        DiagnosticInfoMessage::CannotResolveRefInJsonSchemaToTplLit,
                    ),
                }
            }
            _ => self.error(
                span,
                DiagnosticInfoMessage::TplLitTypeNonStringNonNumberNonBoolean,
            ),
        }
    }

    fn convert_ts_tpl_lit_type_non_trivial(&mut self, it: &TsTplLitType) -> Res<JsonSchema> {
        let mut quasis_idx = 0;
        let mut types_idx = 0;
        let mut selecting_quasis = true;

        let mut acc: Vec<TplLitTypeItem> = vec![];
        let iter_count = it.quasis.len() + it.types.len();
        for _ in 0..iter_count {
            if selecting_quasis {
                let quasis = &it.quasis[quasis_idx];
                quasis_idx += 1;
                acc.push(TplLitTypeItem::Quasis(quasis.raw.to_string()));
                selecting_quasis = false;
            } else {
                let type_ = &it.types[types_idx];
                types_idx += 1;

                let ty = self.convert_ts_type(type_)?;
                acc.push(self.json_schema_to_tpl_lit(&it.span, &ty)?);

                selecting_quasis = true;
            }
        }

        Ok(JsonSchema::TplLitType(acc))
    }
    fn convert_ts_tpl_lit_type(&mut self, it: &TsTplLitType) -> Res<JsonSchema> {
        if !it.types.is_empty() || it.quasis.len() != 1 {
            self.convert_ts_tpl_lit_type_non_trivial(it)
        } else {
            Ok(JsonSchema::Const(JsonSchemaConst::String(
                it.quasis
                    .iter()
                    .map(|it| it.raw.to_string())
                    .collect::<String>(),
            )))
        }
    }

    pub fn convert_ts_type(&mut self, typ: &TsType) -> Res<JsonSchema> {
        match typ {
            TsType::TsKeywordType(TsKeywordType { kind, span, .. }) => {
                self.ts_keyword_type_kind_to_json_schema(*kind, span)
            }
            TsType::TsTypeRef(TsTypeRef {
                type_name,
                type_params,
                ..
            }) => match &type_name {
                TsEntityName::Ident(i) => self.convert_ts_type_ident(i, type_params),
                TsEntityName::TsQualifiedName(q) => self.convert_ts_type_qual(q, type_params),
            },
            TsType::TsTypeLit(TsTypeLit { members, .. }) => Ok(JsonSchema::object(
                members
                    .iter()
                    .map(|prop| self.convert_ts_type_element(prop))
                    .collect::<Res<_>>()?,
                None,
            )),
            TsType::TsArrayType(TsArrayType { elem_type, .. }) => {
                Ok(JsonSchema::Array(self.convert_ts_type(elem_type)?.into()))
            }
            TsType::TsTypeQuery(q) => self.convert_type_query(q),
            TsType::TsUnionOrIntersectionType(it) => match &it {
                TsUnionOrIntersectionType::TsUnionType(TsUnionType { types, .. }) => {
                    self.union(types)
                }
                TsUnionOrIntersectionType::TsIntersectionType(TsIntersectionType {
                    types,
                    span,
                    ..
                }) => self.intersection(types, span),
            },
            TsType::TsTupleType(TsTupleType { elem_types, .. }) => {
                let mut prefix_items = vec![];
                let mut items = None;
                for it in elem_types {
                    if let TsType::TsRestType(TsRestType { type_ann, .. }) = &*it.ty {
                        if items.is_some() {
                            return self.cannot_serialize_error(
                                &it.span,
                                DiagnosticInfoMessage::DuplicatedRestNonSerializableToJsonSchema,
                            );
                        }
                        let ann = extract_items_from_array(self.convert_ts_type(type_ann)?);
                        items = Some(ann.into());
                    } else {
                        let ty_schema = self.convert_ts_type(&it.ty)?;
                        prefix_items.push(ty_schema);
                    }
                }
                Ok(JsonSchema::Tuple {
                    prefix_items,
                    items,
                })
            }
            TsType::TsLitType(TsLitType { lit, .. }) => match lit {
                TsLit::Number(n) => Ok(JsonSchema::Const(JsonSchemaConst::parse_f64(n.value))),
                TsLit::Str(s) => Ok(JsonSchema::Const(JsonSchemaConst::String(
                    s.value.to_string().clone(),
                ))),
                TsLit::Bool(b) => Ok(JsonSchema::Const(JsonSchemaConst::Bool(b.value))),
                TsLit::BigInt(_) => Ok(JsonSchema::Codec(CodecName::BigInt)),
                TsLit::Tpl(it) => self.convert_ts_tpl_lit_type(it),
            },
            TsType::TsParenthesizedType(TsParenthesizedType { type_ann, .. }) => {
                self.convert_ts_type(type_ann)
            }
            TsType::TsOptionalType(TsOptionalType { span, .. }) => {
                self.error(span, DiagnosticInfoMessage::OptionalTypeIsNotSupported)
            }
            TsType::TsTypeOperator(TsTypeOperator { span, op, type_ann }) => match op {
                TsTypeOperatorOp::KeyOf => self.convert_keyof(type_ann),
                TsTypeOperatorOp::Unique => self.cannot_serialize_error(
                    span,
                    DiagnosticInfoMessage::UniqueNonSerializableToJsonSchema,
                ),
                TsTypeOperatorOp::ReadOnly => self.convert_ts_type(type_ann),
            },
            TsType::TsMappedType(k) => self.convert_mapped_type(k),
            TsType::TsRestType(_) => unreachable!("should have been handled by parent node"),
            TsType::TsIndexedAccessType(i) => self.convert_indexed_access(i),
            TsType::TsThisType(TsThisType { span, .. }) => self.cannot_serialize_error(
                span,
                DiagnosticInfoMessage::ThisTypeNonSerializableToJsonSchema,
            ),
            TsType::TsFnOrConstructorType(
                TsFnOrConstructorType::TsConstructorType(TsConstructorType { span, .. })
                | TsFnOrConstructorType::TsFnType(TsFnType { span, .. }),
            ) => self.cannot_serialize_error(
                span,
                DiagnosticInfoMessage::TsFnOrConstructorTypeNonSerializableToJsonSchema,
            ),
            TsType::TsConditionalType(t) => self.convert_conditional_type(t),
            TsType::TsInferType(TsInferType { span, .. }) => self.cannot_serialize_error(
                span,
                DiagnosticInfoMessage::TsInferTypeNonSerializableToJsonSchema,
            ),
            TsType::TsTypePredicate(TsTypePredicate { span, .. }) => self.cannot_serialize_error(
                span,
                DiagnosticInfoMessage::TsTypePredicateNonSerializableToJsonSchema,
            ),
            TsType::TsImportType(TsImportType { span, .. }) => self.cannot_serialize_error(
                span,
                DiagnosticInfoMessage::TsImportTypeNonSerializableToJsonSchema,
            ),
        }
    }

    fn convert_conditional_type(&mut self, t: &TsConditionalType) -> Res<JsonSchema> {
        let check_type_schema = self.convert_ts_type(&t.check_type)?;
        let extends_type_schema = self.convert_ts_type(&t.extends_type)?;

        let mut ctx = SemTypeContext::new();

        let check_type_st = check_type_schema
            .to_sem_type(&self.validators_ref(), &mut ctx)
            .map_err(|e| {
                self.box_error(
                    &t.check_type.span(),
                    DiagnosticInfoMessage::AnyhowError(e.to_string()),
                )
            })?;

        let extends_type_st = extends_type_schema
            .to_sem_type(&self.validators_ref(), &mut ctx)
            .map_err(|e| {
                self.box_error(
                    &t.extends_type.span(),
                    DiagnosticInfoMessage::AnyhowError(e.to_string()),
                )
            })?;

        let is_true = check_type_st.is_subtype(&extends_type_st, &mut ctx);

        if is_true {
            self.convert_ts_type(&t.true_type)
        } else {
            self.convert_ts_type(&t.false_type)
        }
    }
}
