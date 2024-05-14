use std::rc::Rc;

use crate::ast::json_schema::JsonSchema;
use crate::diag::{Diagnostic, DiagnosticInfoMessage, DiagnosticInformation, Location};
use crate::parser_extractor::BuiltDecoder;
use crate::type_to_schema::TypeToSchema;
use crate::{BeffUserSettings, ParsedModule};
use crate::{BffFileName, FileManager, Validator};
use anyhow::anyhow;
use anyhow::Result;
use swc_common::{Span, DUMMY_SP};
use swc_ecma_ast::{
    CallExpr, Callee, Expr, Ident, MemberExpr, MemberProp, TsCallSignatureDecl,
    TsConstructSignatureDecl, TsGetterSignature, TsIndexSignature, TsMethodSignature,
    TsPropertySignature, TsSetterSignature, TsType, TsTypeElement, TsTypeLit,
    TsTypeParamInstantiation,
};
use swc_ecma_visit::Visit;

#[derive(Debug)]
pub struct SchemaExtractResult {
    pub errors: Vec<Diagnostic>,
    pub entry_file_name: BffFileName,
    pub validators: Vec<Validator>,
    pub built_decoders: Option<Vec<BuiltDecoder>>,
    pub counter: usize,
}

struct ExtractSchemaVisitor<'a, R: FileManager> {
    files: &'a mut R,
    current_file: BffFileName,
    validators: Vec<Validator>,
    errors: Vec<Diagnostic>,
    built_decoders: Option<Vec<BuiltDecoder>>,
    settings: &'a BeffUserSettings,
    counter: usize,
}
impl<'a, R: FileManager> ExtractSchemaVisitor<'a, R> {
    fn new(
        files: &'a mut R,
        current_file: BffFileName,
        settings: &'a BeffUserSettings,
    ) -> ExtractSchemaVisitor<'a, R> {
        ExtractSchemaVisitor {
            files,
            current_file,
            validators: vec![],
            errors: vec![],
            built_decoders: None,
            settings,
            counter: 0,
        }
    }
}

impl<'a, R: FileManager> ExtractSchemaVisitor<'a, R> {
    fn build_error(&self, span: &Span, msg: DiagnosticInfoMessage) -> DiagnosticInformation {
        let file = self.files.get_existing_file(&self.current_file);
        Location::build(file, span, &self.current_file).to_info(msg)
    }
    fn push_error(&mut self, span: &Span, msg: DiagnosticInfoMessage) {
        self.errors.push(self.build_error(span, msg).to_diag(None));
    }

    fn error<T>(&mut self, span: &Span, msg: DiagnosticInfoMessage) -> Result<T> {
        let e = anyhow!("{:?}", &msg);
        self.errors.push(self.build_error(span, msg).to_diag(None));
        Err(e)
    }

    fn get_current_file(&mut self) -> Result<Rc<ParsedModule>> {
        let res = self.files.get_or_fetch_file(&self.current_file);

        match res {
            Some(it) => Ok(it),
            None => {
                self.errors.push(
                    self.build_error(
                        &DUMMY_SP,
                        DiagnosticInfoMessage::CannotFindFileWhenConvertingToSchema(
                            self.current_file.clone(),
                        ),
                    )
                    .to_diag(None),
                );
                Err(anyhow!("cannot find file: {}", self.current_file.0))
            }
        }
    }
    fn visit_current_file(&mut self) -> Result<()> {
        let file = self.get_current_file()?;
        let module = file.module.module.clone();
        self.visit_module(&module);
        Ok(())
    }

    fn extend_components(&mut self, defs: Vec<Validator>, span: &Span) {
        for d in defs {
            let found = self.validators.iter_mut().find(|x| x.name == d.name);
            if let Some(found) = found {
                if found.schema != d.schema {
                    // let found_schema = format!("{:?}", found.schema);
                    // let d_schema = format!("{:?}", d.schema);

                    // let msg = format!(
                    //     "Found schema: {},\n\n\n new schema: {}",
                    //     found_schema, d_schema
                    // );
                    // web_sys::console::log_1(&msg.into());
                    // todo!("{:?} Two different types with the same name.", d.name);
                    self.push_error(
                        span,
                        DiagnosticInfoMessage::TwoDifferentTypesWithTheSameName(d.name.clone()),
                    );
                }
            } else {
                self.validators.push(d);
            }
        }
    }
    fn convert_to_json_schema(&mut self, ty: &TsType, span: &Span) -> JsonSchema {
        let mut to_schema = TypeToSchema::new(
            self.files,
            self.current_file.clone(),
            self.settings,
            &mut self.counter,
        );
        let res = to_schema.convert_ts_type(ty);
        match res {
            Ok(res) => {
                let mut kvs = vec![];
                for (k, v) in to_schema.components {
                    // We store type in an Option to support self-recursion.
                    // When we encounter the type while transforming it we return string with the type name.
                    // And we need the option to allow a type to refer to itself before it has been resolved.
                    match v {
                        Some(s) => kvs.push((k, s)),
                        None => self.push_error(
                            span,
                            DiagnosticInfoMessage::CannotResolveTypeReferenceOnExtracting(k),
                        ),
                    }
                }

                kvs.sort_by(|(ka, _), (kb, _)| ka.cmp(kb));
                let ext: Vec<Validator> = kvs.into_iter().map(|(_k, v)| v).collect();
                self.extend_components(ext, span);

                res
            }
            Err(diag) => {
                self.errors.push(*diag);
                JsonSchema::Any
            }
        }
    }
    fn extract_one_built_decoder(&mut self, prop: &TsTypeElement) -> Result<BuiltDecoder> {
        match prop {
            TsTypeElement::TsPropertySignature(TsPropertySignature {
                key,
                type_ann,
                type_params,
                span,
                ..
            }) => {
                if type_params.is_some() {
                    return self.error(span, DiagnosticInfoMessage::GenericDecoderIsNotSupported);
                }

                let key = match &**key {
                    Expr::Ident(ident) => ident.sym.to_string(),
                    _ => {
                        return self.error(span, DiagnosticInfoMessage::InvalidDecoderKey);
                    }
                };
                match type_ann.as_ref().map(|it| &it.type_ann) {
                    Some(ann) => Ok(BuiltDecoder {
                        exported_name: key,
                        schema: self.convert_to_json_schema(ann, span),
                    }),
                    None => self.error(span, DiagnosticInfoMessage::DecoderMustHaveTypeAnnotation),
                }
            }
            TsTypeElement::TsGetterSignature(TsGetterSignature { span, .. })
            | TsTypeElement::TsSetterSignature(TsSetterSignature { span, .. })
            | TsTypeElement::TsMethodSignature(TsMethodSignature { span, .. })
            | TsTypeElement::TsIndexSignature(TsIndexSignature { span, .. })
            | TsTypeElement::TsCallSignatureDecl(TsCallSignatureDecl { span, .. })
            | TsTypeElement::TsConstructSignatureDecl(TsConstructSignatureDecl { span, .. }) => {
                self.error(span, DiagnosticInfoMessage::InvalidDecoderProperty)
            }
        }
    }
    fn extract_built_decoders_from_call(
        &mut self,
        params: &TsTypeParamInstantiation,
    ) -> Result<Vec<BuiltDecoder>> {
        match params.params.split_first() {
            Some((head, tail)) => {
                if !tail.is_empty() {
                    return self.error(
                        &params.span,
                        DiagnosticInfoMessage::TooManyTypeParamsOnDecoder,
                    );
                }
                match &**head {
                    TsType::TsTypeLit(TsTypeLit { members, .. }) => members
                        .iter()
                        .map(|prop| self.extract_one_built_decoder(prop))
                        .collect(),
                    _ => self.error(
                        &params.span,
                        DiagnosticInfoMessage::DecoderShouldBeObjectWithTypesAndNames,
                    ),
                }
            }
            None => self.error(
                &params.span,
                DiagnosticInfoMessage::TooFewTypeParamsOnDecoder,
            ),
        }
    }

    pub fn extract_special_calls(&mut self, id: &Ident, n: &CallExpr) {
        let Ident { sym, span, .. } = id;
        if sym == "buildSchemas" {
            match self.built_decoders {
                Some(_) => self.push_error(span, DiagnosticInfoMessage::TwoCallsToBuildSchemas),
                None => {
                    if let Some(ref params) = n.type_args {
                        if let Ok(x) = self.extract_built_decoders_from_call(params.as_ref()) {
                            self.built_decoders = Some(x)
                        }
                    }
                }
            }
        }
    }
}

impl<'a, R: FileManager> Visit for ExtractSchemaVisitor<'a, R> {
    fn visit_call_expr(&mut self, n: &CallExpr) {
        match n.callee {
            Callee::Super(_) => {}
            Callee::Import(_) => {}
            Callee::Expr(ref expr) => {
                if let Expr::Ident(id) = &**expr {
                    self.extract_special_calls(id, n)
                }

                if let Expr::Member(MemberExpr { prop, .. }) = &**expr {
                    match prop {
                        MemberProp::Ident(id) => self.extract_special_calls(id, n),
                        MemberProp::PrivateName(_) => {}
                        MemberProp::Computed(_) => {}
                    }
                }
            }
        }
    }
}

pub fn extract_schema<R: FileManager>(
    files: &mut R,
    entry_file_name: BffFileName,
    settings: &BeffUserSettings,
) -> SchemaExtractResult {
    let (errors, validators, built_decoders, counter) = {
        let mut visitor = ExtractSchemaVisitor::new(files, entry_file_name.clone(), settings);
        let _ = visitor.visit_current_file();
        (
            visitor.errors,
            visitor.validators,
            visitor.built_decoders,
            visitor.counter,
        )
    };

    SchemaExtractResult {
        errors,
        entry_file_name,
        validators,
        built_decoders,
        counter,
    }
}
