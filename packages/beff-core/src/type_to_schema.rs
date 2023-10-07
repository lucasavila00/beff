use crate::ast::json::Json;
use crate::ast::json_schema::{CodecName, JsonSchema, Optionality};
use crate::diag::{
    Diagnostic, DiagnosticInfoMessage, DiagnosticInformation, DiagnosticParentMessage, Location,
};
use crate::open_api_ast::Validator;
use crate::subtyping::semtype::{SemType, SemTypeContext, SemTypeOps};
use crate::subtyping::subtype::StringLitOrFormat;
use crate::subtyping::to_schema::to_validators;
use crate::subtyping::ToSemType;
use crate::sym_reference::{ResolvedLocalSymbol, TypeResolver};
use crate::{BeffUserSettings, BffFileName, FileManager, ImportReference, SymbolExport};
use std::collections::{BTreeMap, HashMap};
use std::rc::Rc;
use swc_atoms::JsWord;
use swc_common::{Span, Spanned};
use swc_ecma_ast::{
    Expr, Ident, Lit, MemberProp, Prop, PropName, PropOrSpread, Str, TsArrayType,
    TsConditionalType, TsConstructorType, TsEntityName, TsFnOrConstructorType, TsFnType,
    TsImportType, TsIndexedAccessType, TsInferType, TsInterfaceDecl, TsIntersectionType,
    TsKeywordType, TsKeywordTypeKind, TsLit, TsLitType, TsMappedType, TsOptionalType,
    TsParenthesizedType, TsQualifiedName, TsRestType, TsThisType, TsTplLitType, TsTupleType,
    TsType, TsTypeElement, TsTypeLit, TsTypeOperator, TsTypeOperatorOp, TsTypeParam,
    TsTypeParamDecl, TsTypeParamInstantiation, TsTypePredicate, TsTypeQuery, TsTypeQueryExpr,
    TsTypeRef, TsUnionOrIntersectionType, TsUnionType,
};

pub struct TypeToSchema<'a, R: FileManager> {
    pub files: &'a mut R,
    pub current_file: BffFileName,
    pub components: HashMap<String, Option<Validator>>,
    pub ref_stack: Vec<DiagnosticInformation>,
    pub type_param_stack: Vec<BTreeMap<String, JsonSchema>>,
    pub settings: &'a BeffUserSettings,
}

fn extract_items_from_array(it: JsonSchema) -> JsonSchema {
    match it {
        JsonSchema::Array(items) => *items,
        _ => it,
    }
}

type Res<T> = Result<T, Box<Diagnostic>>;

impl<'a, R: FileManager> TypeToSchema<'a, R> {
    pub fn new(
        files: &'a mut R,
        current_file: BffFileName,
        settings: &'a BeffUserSettings,
    ) -> TypeToSchema<'a, R> {
        TypeToSchema {
            files,
            current_file,
            components: HashMap::new(),
            ref_stack: vec![],
            type_param_stack: vec![],
            settings,
        }
    }
    fn ts_keyword_type_kind_to_json_schema(
        &mut self,
        kind: TsKeywordTypeKind,
        span: &Span,
    ) -> Res<JsonSchema> {
        match kind {
            TsKeywordTypeKind::TsUndefinedKeyword | TsKeywordTypeKind::TsNullKeyword => {
                Ok(JsonSchema::Null)
            }
            TsKeywordTypeKind::TsBigIntKeyword => Ok(JsonSchema::Codec(CodecName::BigInt)),
            TsKeywordTypeKind::TsAnyKeyword
            | TsKeywordTypeKind::TsUnknownKeyword
            | TsKeywordTypeKind::TsObjectKeyword => Ok(JsonSchema::Any),
            TsKeywordTypeKind::TsNeverKeyword
            | TsKeywordTypeKind::TsSymbolKeyword
            | TsKeywordTypeKind::TsIntrinsicKeyword
            | TsKeywordTypeKind::TsVoidKeyword => self.cannot_serialize_error(
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
            TsTypeElement::TsGetterSignature(_)
            | TsTypeElement::TsSetterSignature(_)
            | TsTypeElement::TsMethodSignature(_)
            | TsTypeElement::TsIndexSignature(_)
            | TsTypeElement::TsCallSignatureDecl(_)
            | TsTypeElement::TsConstructSignatureDecl(_) => self.cannot_serialize_error(
                &prop.span(),
                DiagnosticInfoMessage::PropertyNonSerializableToJsonSchema,
            ),
        }
    }

    fn convert_ts_interface_decl(
        &mut self,
        typ: &TsInterfaceDecl,
        type_args: &Option<Box<TsTypeParamInstantiation>>,
    ) -> Res<JsonSchema> {
        if !typ.extends.is_empty() {
            return self.cannot_serialize_error(
                &typ.span,
                DiagnosticInfoMessage::TsInterfaceExtendsNotSupported,
            );
        }

        let args = type_args
            .as_ref()
            .map(|it| it.params.iter().map(|it| it.as_ref()).collect::<Vec<_>>());
        let params = typ.type_params.as_ref().map(|it| &it.params);

        let map = self.get_type_params_stack_map(args, params)?;

        self.type_param_stack.push(map);

        let r = Ok(JsonSchema::object(
            typ.body
                .body
                .iter()
                .map(|x| self.convert_ts_type_element(x))
                .collect::<Res<_>>()?,
        ));
        self.type_param_stack.pop();
        r
    }

    fn convert_type_export(
        &mut self,
        exported: &SymbolExport,
        from_file: &BffFileName,
        type_args: &Option<Box<TsTypeParamInstantiation>>,
    ) -> Res<JsonSchema> {
        let store_current_file = self.current_file.clone();
        self.current_file = from_file.clone();
        let ty = match exported {
            SymbolExport::TsType {
                ty: alias, params, ..
            } => self.apply_type_params(type_args, params, alias)?,

            SymbolExport::TsInterfaceDecl { decl: int, .. } => {
                self.convert_ts_interface_decl(int, type_args)?
            }
            SymbolExport::StarOfOtherFile { .. } => {
                return self.error(&exported.span(), DiagnosticInfoMessage::CannotUseStarAsType)
            }
            SymbolExport::SomethingOfOtherFile {
                something: word,
                file: from_file,
                span,
            } => {
                let exported = self
                    .files
                    .get_or_fetch_file(from_file)
                    .and_then(|file| file.symbol_exports.get(word, self.files));
                match exported {
                    Some(exported) => {
                        self.convert_type_export(exported.as_ref(), from_file, type_args)?
                    }
                    None => {
                        return self.error(
                            span,
                            DiagnosticInfoMessage::CannotResolveSomethingOfOtherFile(
                                word.to_string(),
                            ),
                        )
                    }
                }
            }
            SymbolExport::ValueExpr { span, .. } => {
                return self.error(span, DiagnosticInfoMessage::FoundValueExpectedType)
            }
        };
        self.current_file = store_current_file;
        Ok(ty)
    }

    fn get_type_params_stack_map(
        &mut self,
        args: Option<Vec<&TsType>>,
        params: Option<&Vec<TsTypeParam>>,
    ) -> Res<BTreeMap<String, JsonSchema>> {
        let mut map: BTreeMap<String, JsonSchema> = BTreeMap::new();
        if let Some(params) = params {
            let empty_args = vec![];
            let args_vec = args.unwrap_or(empty_args);

            for (idx, param) in params.iter().enumerate() {
                // check if there is a corresponding type arg,
                // use default if there is not

                let positional_arg = args_vec.get(idx);

                let param_name = param.name.sym.to_string();
                let param_type = match positional_arg {
                    Some(arg) => Some(self.convert_ts_type(arg)?),
                    None => param
                        .default
                        .as_ref()
                        .map(|it| self.convert_ts_type(it))
                        .transpose()?,
                };
                match param_type {
                    Some(param_type) => {
                        map.insert(param_name, param_type);
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
            assert!(args.is_none());
        }

        Ok(map)
    }

    fn apply_type_params(
        &mut self,
        type_args: &Option<Box<TsTypeParamInstantiation>>,
        decl: &Option<Rc<TsTypeParamDecl>>,
        ty: &TsType,
    ) -> Res<JsonSchema> {
        let args = type_args
            .as_ref()
            .map(|it| it.params.iter().map(|it| it.as_ref()).collect::<Vec<_>>());
        let params = decl.as_ref().map(|it| &it.params);

        let map = self.get_type_params_stack_map(args, params)?;
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
        match TypeResolver::new(self.files, &self.current_file).resolve_local_type(i)? {
            ResolvedLocalSymbol::TsType(decl, ty) => self.apply_type_params(type_args, &decl, &ty),
            ResolvedLocalSymbol::TsInterfaceDecl(int) => {
                self.convert_ts_interface_decl(&int, type_args)
            }
            ResolvedLocalSymbol::NamedImport {
                exported,
                from_file,
            } => {
                return self.convert_type_export(
                    exported.as_ref(),
                    from_file.file_name(),
                    type_args,
                )
            }
            ResolvedLocalSymbol::Star(_)
            | ResolvedLocalSymbol::Expr(_)
            | ResolvedLocalSymbol::SymbolExportDefault(_) => {
                self.error(&i.span, DiagnosticInfoMessage::FoundValueExpectedType)
            }
        }
    }

    fn insert_definition(&mut self, name: String, schema: JsonSchema) -> Res<JsonSchema> {
        if let Some(Some(v)) = self.components.get(&name) {
            assert_eq!(v.schema, schema);
        }
        self.components.insert(
            name.clone(),
            Some(Validator {
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
                    if self.settings.custom_formats.contains(&val_str) {
                        return Ok(JsonSchema::StringWithFormat(val_str));
                    } else {
                        return self
                            .error(span, DiagnosticInfoMessage::CustomFormatIsNotRegistered);
                    }
                }
            }
        }
        self.error(
            span,
            DiagnosticInfoMessage::InvalidUsageOfStringFormatTypeParameter,
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
            _ => {}
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
        let val = JsonSchema::all_of(vs);

        Ok(val)
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
    fn error<T>(&mut self, span: &Span, msg: DiagnosticInfoMessage) -> Res<T> {
        let err = self.create_error(span, msg);
        Err(err.to_diag(None).into())
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
            .and_then(|module| module.symbol_exports.get(right, self.files));
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
                    .and_then(|module| module.symbol_exports.get(word, self.files));

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
                let ns =
                    TypeResolver::new(self.files, &self.current_file).resolve_namespace_type(i)?;
                self.get_qualified_type_from_file(&ns.from_file, &q.right.sym, &q.right.span)
            }
        }
    }

    fn __convert_ts_type_qual_caching(
        &mut self,
        q: &TsQualifiedName,
        type_args: &Option<Box<TsTypeParamInstantiation>>,
    ) -> Res<JsonSchema> {
        let found = self.components.get(&(q.right.sym.to_string()));
        if let Some(_found) = found {
            return Ok(JsonSchema::Ref(q.right.sym.to_string()));
        }

        let (exported, from_file, name) = self.__convert_ts_type_qual_inner(q)?;
        let ty = self.convert_type_export(exported.as_ref(), from_file.file_name(), type_args)?;
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
            Expr::Lit(l) => match l {
                Lit::Str(s) => {
                    if as_const {
                        Ok(JsonSchema::Const(Json::String(s.value.to_string())))
                    } else {
                        Ok(JsonSchema::String)
                    }
                }
                Lit::Bool(b) => {
                    if as_const {
                        Ok(JsonSchema::Const(Json::Bool(b.value)))
                    } else {
                        Ok(JsonSchema::Boolean)
                    }
                }
                Lit::Null(_) => Ok(JsonSchema::Null),
                Lit::Num(n) => {
                    if as_const {
                        Ok(JsonSchema::Const(Json::parse_f64(n.value)))
                    } else {
                        Ok(JsonSchema::Number)
                    }
                }
                Lit::BigInt(_) => Ok(JsonSchema::Codec(CodecName::BigInt)),
                Lit::Regex(_) => todo!(),
                Lit::JSXText(_) => todo!(),
            },
            Expr::Array(lit) => {
                let mut prefix_items = vec![];
                for it in lit.elems.iter().flatten() {
                    match it.spread {
                        Some(_) => todo!(),
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
                        PropOrSpread::Spread(_) => todo!(),
                        PropOrSpread::Prop(p) => match p.as_ref() {
                            Prop::KeyValue(p) => {
                                let key: String = match &p.key {
                                    PropName::Ident(id) => id.sym.to_string(),
                                    PropName::Str(st) => st.value.to_string(),
                                    PropName::Num(_) => todo!(),
                                    PropName::Computed(_) => todo!(),
                                    PropName::BigInt(_) => todo!(),
                                };
                                let value = self.typeof_expr(&p.value, as_const)?;
                                vs.insert(key, value.required());
                            }
                            Prop::Shorthand(_)
                            | Prop::Assign(_)
                            | Prop::Getter(_)
                            | Prop::Setter(_)
                            | Prop::Method(_) => todo!(),
                        },
                    }
                }

                Ok(JsonSchema::Object(vs))
            }
            Expr::Ident(i) => {
                let s = TypeResolver::new(self.files, &self.current_file).resolve_local_value(i)?;
                self.typeof_symbol(s, &i.span)
            }
            Expr::TsConstAssertion(c) => self.typeof_expr(&c.expr, true),
            Expr::Member(m) => {
                let mut ctx = SemTypeContext::new();
                let obj = self.typeof_expr(&m.obj, as_const)?;
                if let JsonSchema::Object(vs) = &obj {
                    // try to do it syntatically to preserve aliases
                    if let Some(key) = match &m.prop {
                        MemberProp::Ident(i) => Some(i.sym.to_string()),
                        MemberProp::Computed(c) => match self.typeof_expr(&c.expr, as_const)? {
                            JsonSchema::Const(Json::String(s)) => Some(s.clone()),
                            _ => None,
                        },
                        MemberProp::PrivateName(_) => None,
                    } {
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
                    MemberProp::PrivateName(_) => todo!(),
                    MemberProp::Computed(c) => {
                        let v = self.typeof_expr(&c.expr, as_const)?;
                        v.to_sem_type(&self.validators_ref(), &mut ctx).unwrap()
                    }
                };
                let st = obj.to_sem_type(&self.validators_ref(), &mut ctx).unwrap();
                let access_st: Rc<SemType> = ctx.indexed_access(st, key);
                self.convert_sem_type(access_st, &mut ctx, &m.prop.span())
            }
            _ => {
                dbg!(e);
                todo!()
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
        let ty: JsonSchema = match exported.as_ref() {
            SymbolExport::TsType { .. } | SymbolExport::TsInterfaceDecl { .. } => todo!(),
            SymbolExport::ValueExpr { expr, .. } => self.typeof_expr(expr, false)?,
            SymbolExport::StarOfOtherFile { .. } => todo!(),
            SymbolExport::SomethingOfOtherFile { .. } => todo!(),
        };
        self.current_file = old_file;
        Ok(ty)
    }

    fn collect_value_exports(
        &mut self,
        file_name: &BffFileName,
        acc: &mut Vec<(String, Optionality<JsonSchema>)>,
    ) -> Res<()> {
        let file = self.files.get_or_fetch_file(file_name);
        if let Some(pm) = file {
            for (k, v) in &pm.symbol_exports.named {
                match v.as_ref() {
                    SymbolExport::TsType { .. } | SymbolExport::TsInterfaceDecl { .. } => {}
                    SymbolExport::ValueExpr { expr, name: _, .. } => {
                        let ty = self.typeof_expr(expr, false)?;
                        acc.push((k.to_string(), ty.required()));
                    }
                    SymbolExport::StarOfOtherFile { reference, .. } => match reference.as_ref() {
                        ImportReference::Named { .. } => todo!(),
                        ImportReference::Star { file_name, .. } => {
                            let mut acc2 = vec![];
                            self.collect_value_exports(file_name, &mut acc2)?;
                            let v = JsonSchema::object(acc2);
                            acc.push((k.to_string(), v.required()));
                        }
                        ImportReference::Default { .. } => todo!(),
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
                Ok(JsonSchema::object(acc))
            }
        }
    }
    fn get_kv_from_schema(&mut self, schema: JsonSchema, key: &str) -> Res<JsonSchema> {
        match schema {
            JsonSchema::Object(kvs) => match kvs.get(key) {
                Some(Optionality::Required(v)) => Ok(v.clone()),
                _ => todo!(),
            },
            _ => todo!(),
        }
    }
    fn convert_type_query_qualified(&mut self, q: &TsQualifiedName) -> Res<JsonSchema> {
        match &q.left {
            TsEntityName::TsQualifiedName(q) => {
                let t = self.convert_type_query_qualified(q)?;
                self.get_kv_from_schema(t, q.right.sym.as_ref())
            }
            TsEntityName::Ident(id) => {
                let s =
                    TypeResolver::new(self.files, &self.current_file).resolve_local_value(id)?;
                let t = self.typeof_symbol(s, &q.left.span())?;
                self.get_kv_from_schema(t, q.right.sym.as_ref())
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
                    let s =
                        TypeResolver::new(self.files, &self.current_file).resolve_local_value(n)?;
                    self.typeof_symbol(s, &n.span)
                }
            },
        }
    }
    fn validators_ref(&self) -> Vec<&Validator> {
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
            return self.error(span, DiagnosticInfoMessage::InvalidIndexedAccess);
        }
        let (head, tail) = to_validators(ctx, &access_st, "AnyName");
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
            (JsonSchema::Object(vs), JsonSchema::Const(Json::String(s))) => {
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

        let obj_st = obj.to_sem_type(&self.validators_ref(), &mut ctx).unwrap();
        let idx_st = index.to_sem_type(&self.validators_ref(), &mut ctx).unwrap();

        let access_st: Rc<SemType> = ctx.indexed_access(obj_st, idx_st);
        self.convert_sem_type(access_st, &mut ctx, &i.index_type.span())
    }
    fn convert_keyof(&mut self, k: &TsType) -> Res<JsonSchema> {
        let json_schema = self.convert_ts_type(k)?;
        let mut ctx = SemTypeContext::new();
        let st = json_schema
            .to_sem_type(&self.validators_ref(), &mut ctx)
            .unwrap();

        let keyof_st: Rc<SemType> = ctx.keyof(st);

        self.convert_sem_type(keyof_st, &mut ctx, &k.span())
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
                TsLit::Number(n) => Ok(JsonSchema::Const(Json::parse_f64(n.value))),
                TsLit::Str(s) => Ok(JsonSchema::Const(Json::String(s.value.to_string().clone()))),
                TsLit::Bool(b) => Ok(JsonSchema::Const(Json::Bool(b.value))),
                TsLit::BigInt(_) => Ok(JsonSchema::Codec(CodecName::BigInt)),
                TsLit::Tpl(TsTplLitType {
                    span,
                    types,
                    quasis,
                }) => {
                    if !types.is_empty() || quasis.len() != 1 {
                        return self.cannot_serialize_error(
                            span,
                            DiagnosticInfoMessage::TemplateNonSerializableToJsonSchema,
                        );
                    }

                    Ok(JsonSchema::Const(Json::String(
                        quasis
                            .iter()
                            .map(|it| it.raw.to_string())
                            .collect::<String>(),
                    )))
                }
            },
            TsType::TsParenthesizedType(TsParenthesizedType { type_ann, .. }) => {
                self.convert_ts_type(type_ann)
            }
            TsType::TsOptionalType(TsOptionalType { span, .. }) => {
                self.error(span, DiagnosticInfoMessage::OptionalTypeIsNotSupported)
            }
            TsType::TsTypeOperator(TsTypeOperator { span, op, type_ann }) => match op {
                TsTypeOperatorOp::KeyOf => self.convert_keyof(type_ann),
                TsTypeOperatorOp::Unique | TsTypeOperatorOp::ReadOnly => self
                    .cannot_serialize_error(
                        span,
                        DiagnosticInfoMessage::TypeConstructNonSerializableToJsonSchema,
                    ),
            },
            TsType::TsRestType(_) => unreachable!("should have been handled by parent node"),
            TsType::TsThisType(TsThisType { span, .. })
            | TsType::TsFnOrConstructorType(
                TsFnOrConstructorType::TsConstructorType(TsConstructorType { span, .. })
                | TsFnOrConstructorType::TsFnType(TsFnType { span, .. }),
            )
            | TsType::TsConditionalType(TsConditionalType { span, .. })
            | TsType::TsInferType(TsInferType { span, .. })
            | TsType::TsMappedType(TsMappedType { span, .. })
            | TsType::TsTypePredicate(TsTypePredicate { span, .. })
            | TsType::TsImportType(TsImportType { span, .. }) => self.cannot_serialize_error(
                span,
                DiagnosticInfoMessage::TypeConstructNonSerializableToJsonSchema,
            ),
            TsType::TsIndexedAccessType(i) => self.convert_indexed_access(i),
        }
    }
}
