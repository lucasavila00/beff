use crate::api_extractor::FileManager;
use crate::diag::{
    span_to_loc, Diagnostic, DiagnosticInfoMessage, DiagnosticInformation, DiagnosticMessage,
};
use crate::open_api_ast::Json;
use crate::open_api_ast::{Definition, JsonSchema, Optionality};
use crate::{ImportReference, ParsedModule, TypeExport};
use std::collections::HashMap;
use std::rc::Rc;
use swc_common::Span;
use swc_ecma_ast::{
    BigInt, Expr, Ident, TsArrayType, TsCallSignatureDecl, TsConditionalType,
    TsConstructSignatureDecl, TsConstructorType, TsEntityName, TsFnOrConstructorType, TsFnType,
    TsGetterSignature, TsImportType, TsIndexSignature, TsIndexedAccessType, TsInferType,
    TsInterfaceDecl, TsIntersectionType, TsKeywordType, TsKeywordTypeKind, TsLit, TsLitType,
    TsMappedType, TsMethodSignature, TsOptionalType, TsParenthesizedType, TsRestType,
    TsSetterSignature, TsThisType, TsTplLitType, TsTupleType, TsType, TsTypeElement, TsTypeLit,
    TsTypeOperator, TsTypeParamInstantiation, TsTypePredicate, TsTypeQuery, TsTypeRef,
    TsUnionOrIntersectionType, TsUnionType,
};

pub struct TypeToSchema<'a, R: FileManager> {
    pub files: &'a mut R,
    pub current_file: &'a str,
    pub components: HashMap<String, Option<Definition>>,
    pub ref_stack: Vec<DiagnosticInformation>,
}

fn extract_items_from_array(it: JsonSchema) -> JsonSchema {
    match it {
        JsonSchema::Array(items) => *items,
        _ => it,
    }
}

type Res<T> = Result<T, Diagnostic>;

impl<'a, R: FileManager> TypeToSchema<'a, R> {
    pub fn new(files: &'a mut R, current_file: &'a str) -> TypeToSchema<'a, R> {
        TypeToSchema {
            files,
            current_file,
            components: HashMap::new(),
            ref_stack: vec![],
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
            TsKeywordTypeKind::TsAnyKeyword
            | TsKeywordTypeKind::TsUnknownKeyword
            | TsKeywordTypeKind::TsObjectKeyword => Ok(JsonSchema::Any),
            TsKeywordTypeKind::TsBigIntKeyword
            | TsKeywordTypeKind::TsNeverKeyword
            | TsKeywordTypeKind::TsSymbolKeyword
            | TsKeywordTypeKind::TsIntrinsicKeyword
            | TsKeywordTypeKind::TsVoidKeyword => self.cannot_serialize_error(span),
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
                    _ => {
                        return self.error(&prop.span, DiagnosticInfoMessage::PropKeyShouldBeIdent)
                    }
                };
                match &prop.type_ann.as_ref() {
                    Some(val) => {
                        let value = self.convert_ts_type(&val.type_ann)?;
                        let value = if prop.optional {
                            Optionality::Optional(value)
                        } else {
                            Optionality::Required(value)
                        };
                        Ok((key, value))
                    }
                    None => self.error(
                        &prop.span,
                        DiagnosticInfoMessage::PropShouldHaveTypeAnnotation,
                    ),
                }
            }
            TsTypeElement::TsGetterSignature(TsGetterSignature { span, .. })
            | TsTypeElement::TsSetterSignature(TsSetterSignature { span, .. })
            | TsTypeElement::TsMethodSignature(TsMethodSignature { span, .. })
            | TsTypeElement::TsIndexSignature(TsIndexSignature { span, .. })
            | TsTypeElement::TsCallSignatureDecl(TsCallSignatureDecl { span, .. })
            | TsTypeElement::TsConstructSignatureDecl(TsConstructSignatureDecl { span, .. }) => {
                self.cannot_serialize_error(span)
            }
        }
    }

    fn convert_ts_interface_decl(&mut self, typ: &TsInterfaceDecl) -> Res<JsonSchema> {
        if !typ.extends.is_empty() {
            return self.error(
                &typ.span,
                DiagnosticInfoMessage::TsInterfaceExtendsNotSupported,
            );
        }

        Ok(JsonSchema::Object {
            values: typ
                .body
                .body
                .iter()
                .map(|x| self.convert_ts_type_element(x))
                .collect::<Res<_>>()?,
        })
    }

    pub fn insert_definition(&mut self, name: String, schema: JsonSchema) -> Res<JsonSchema> {
        self.components.insert(
            name.clone(),
            Some(Definition {
                name: name.clone(),
                schema,
            }),
        );
        Ok(JsonSchema::Ref(name))
    }

    fn get_current_file(&mut self) -> Rc<ParsedModule> {
        self.files
            .get_or_fetch_file(&self.current_file)
            .expect("should have been parsed")
    }

    pub fn get_type_ref(
        &mut self,
        i: &Ident,
        type_params: &Option<Box<TsTypeParamInstantiation>>,
    ) -> Res<JsonSchema> {
        match i.sym.to_string().as_str() {
            "Date" => return Ok(JsonSchema::String),
            "Array" => {
                let type_params = type_params.as_ref();
                match type_params {
                    Some(type_params) => {
                        let ty = self.convert_ts_type(&type_params.params[0])?;
                        return Ok(JsonSchema::Array(ty.into()));
                    }
                    None => {
                        return Ok(JsonSchema::Array(JsonSchema::Any.into()));
                    }
                }
            }
            _ => {}
        }

        let found = self.components.get(&(i.sym.to_string()));
        if let Some(_found) = found {
            return Ok(JsonSchema::Ref(i.sym.to_string()));
        }
        self.components.insert(i.sym.to_string(), None);

        if type_params.is_some() {
            self.insert_definition(i.sym.to_string(), JsonSchema::Any)?;
            return self.cannot_serialize_error(&i.span);
        }

        if let Some(alias) = self
            .get_current_file()
            .locals
            .type_aliases
            .get(&(i.sym.clone(), i.span.ctxt))
        {
            let alias = alias.clone();
            let ty = self.convert_ts_type(&alias)?;
            return self.insert_definition(i.sym.to_string(), ty);
        }

        if let Some(int) = self
            .get_current_file()
            .locals
            .interfaces
            .get(&(i.sym.clone(), i.span.ctxt))
        {
            let int = int.clone();
            let ty = self.convert_ts_interface_decl(&int)?;
            return self.insert_definition(i.sym.to_string(), ty);
        }

        let mut found: Option<TypeExport> = None;
        let mut found_imp: Option<ImportReference> = None;

        if let Some(imported) = self
            .get_current_file()
            .imports
            .get(&(i.sym.clone(), i.span.ctxt))
        {
            let file = self.files.get_or_fetch_file(&imported.file_name);
            match file {
                Some(file) => {
                    let exp = file.type_exports.get(&i.sym);
                    match exp {
                        Some(f) => {
                            found = Some(f.clone());
                            found_imp = Some(imported.clone());
                        }
                        None => {
                            return self.error(
                                &i.span,
                                DiagnosticInfoMessage::CannotFindTypeExportWhenConvertingToSchema(
                                    i.sym.to_string(),
                                ),
                            )
                        }
                    }
                }
                None => {
                    return self.error(
                        &i.span,
                        DiagnosticInfoMessage::CannotFindFileWhenConvertingToSchema(
                            imported.file_name.to_string(),
                        ),
                    )
                }
            }
        }
        match found {
            Some(TypeExport::TsType(alias)) => {
                let imported = found_imp.expect("should exist");
                let mut chd_file_converter = TypeToSchema::new(self.files, &imported.file_name);

                let ty = chd_file_converter.convert_ts_type(&alias)?;
                self.components.extend(chd_file_converter.components);
                return self.insert_definition(i.sym.to_string(), ty);
            }
            Some(TypeExport::TsInterfaceDecl(int)) => {
                let imported = found_imp.expect("should exist");
                let mut chd_file_converter = TypeToSchema::new(self.files, &imported.file_name);
                let ty = chd_file_converter.convert_ts_interface_decl(&int)?;
                self.components.extend(chd_file_converter.components);
                return self.insert_definition(i.sym.to_string(), ty);
            }
            None => {}
        }

        self.error(
            &i.span,
            DiagnosticInfoMessage::CannotResolveTypeReferenceOnConverting(i.sym.to_string()),
        )
    }

    fn union(&mut self, types: &[Box<TsType>]) -> Res<JsonSchema> {
        Ok(JsonSchema::AnyOf(
            types
                .iter()
                .map(|it| self.convert_ts_type(it))
                .collect::<Res<_>>()?,
        ))
    }

    fn intersection(&mut self, types: &[Box<TsType>]) -> Res<JsonSchema> {
        Ok(JsonSchema::AllOf(
            types
                .iter()
                .map(|it| self.convert_ts_type(it))
                .collect::<Res<_>>()?,
        ))
    }

    fn cannot_serialize_error<T>(&mut self, span: &Span) -> Res<T> {
        let cause = self.create_error(span, DiagnosticInfoMessage::CannotConvertTypeToSchema);

        match self.ref_stack.split_first() {
            Some((head, tail)) => {
                let mut related_information = tail.to_vec();
                related_information.push(cause);
                Err(Diagnostic {
                    cause: head.clone(),
                    related_information: Some(related_information),
                    message: DiagnosticMessage::CannotConvertToSchema,
                })
            }
            None => Err(Diagnostic {
                message: DiagnosticMessage::CannotConvertToSchema,
                cause,
                related_information: None,
            }),
        }
    }

    fn create_error(&mut self, span: &Span, msg: DiagnosticInfoMessage) -> DiagnosticInformation {
        let file = self.files.get_or_fetch_file(&self.current_file);
        match file {
            Some(file) => {
                let (loc_lo, loc_hi) =
                    span_to_loc(span, &file.module.source_map, file.module.fm.end_pos);

                DiagnosticInformation::KnownFile {
                    message: msg,
                    file_name: self.current_file.to_string(),
                    loc_hi,
                    loc_lo,
                }
            }
            None => DiagnosticInformation::UnknownFile {
                message: msg,
                current_file: self.current_file.to_string(),
            },
        }
    }
    fn error<T>(&mut self, span: &Span, msg: DiagnosticInfoMessage) -> Res<T> {
        let err = self.create_error(span, msg);
        Err(err.to_diag())
    }
    pub fn get_current_reference(&mut self, i: &Ident) -> Option<DiagnosticInformation> {
        self.files
            .get_or_fetch_file(&self.current_file)
            .map(|file| {
                let (loc_lo, loc_hi) =
                    span_to_loc(&i.span, &file.module.source_map, file.module.fm.end_pos);

                DiagnosticInformation::KnownFile {
                    file_name: self.current_file.to_string(),
                    loc_hi,
                    loc_lo,
                    message: DiagnosticInfoMessage::ThisRefersToSomethingThatCannotBeSerialized(
                        i.sym.to_string(),
                    ),
                }
            })
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
                TsEntityName::TsQualifiedName(data) => self.error(
                    &data.right.span,
                    DiagnosticInfoMessage::TsQualifiedNameNotSupported,
                ),
                TsEntityName::Ident(i) => {
                    let current_ref = self.get_current_reference(i);
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
            },
            TsType::TsTypeLit(TsTypeLit { members, .. }) => Ok(JsonSchema::Object {
                values: members
                    .iter()
                    .map(|prop| self.convert_ts_type_element(prop))
                    .collect::<Res<_>>()?,
            }),
            TsType::TsArrayType(TsArrayType { elem_type, .. }) => {
                Ok(JsonSchema::Array(self.convert_ts_type(elem_type)?.into()))
            }
            TsType::TsUnionOrIntersectionType(it) => match &it {
                TsUnionOrIntersectionType::TsUnionType(TsUnionType { types, .. }) => {
                    self.union(types)
                }
                TsUnionOrIntersectionType::TsIntersectionType(TsIntersectionType {
                    types, ..
                }) => self.intersection(types),
            },
            TsType::TsTupleType(TsTupleType { elem_types, .. }) => {
                let mut prefix_items = vec![];
                let mut items = None;
                for it in elem_types {
                    if let TsType::TsRestType(TsRestType { type_ann, .. }) = &*it.ty {
                        if items.is_some() {
                            return self.cannot_serialize_error(&it.span);
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
                TsLit::Number(n) => Ok(JsonSchema::Const(Json::Number(n.value))),
                TsLit::Str(s) => Ok(JsonSchema::Const(Json::String(s.value.to_string().clone()))),
                TsLit::Bool(b) => Ok(JsonSchema::Const(Json::Bool(b.value))),
                TsLit::BigInt(BigInt { span, .. }) => self.cannot_serialize_error(span),
                TsLit::Tpl(TsTplLitType {
                    span,
                    types,
                    quasis,
                }) => {
                    if !types.is_empty() || quasis.len() != 1 {
                        return self.cannot_serialize_error(span);
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
            TsType::TsRestType(_) => unreachable!("should have been handled by parent node"),
            TsType::TsThisType(TsThisType { span, .. })
            | TsType::TsFnOrConstructorType(
                TsFnOrConstructorType::TsConstructorType(TsConstructorType { span, .. })
                | TsFnOrConstructorType::TsFnType(TsFnType { span, .. }),
            )
            | TsType::TsConditionalType(TsConditionalType { span, .. })
            | TsType::TsInferType(TsInferType { span, .. })
            | TsType::TsTypeOperator(TsTypeOperator { span, .. })
            | TsType::TsMappedType(TsMappedType { span, .. })
            | TsType::TsTypePredicate(TsTypePredicate { span, .. })
            | TsType::TsImportType(TsImportType { span, .. })
            | TsType::TsTypeQuery(TsTypeQuery { span, .. }) => self.cannot_serialize_error(span),
            TsType::TsIndexedAccessType(TsIndexedAccessType { span, .. }) => self.error(
                span,
                DiagnosticInfoMessage::CannotUnderstandTsIndexedAccessType,
            ),
        }
    }
}
