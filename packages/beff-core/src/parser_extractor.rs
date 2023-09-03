use std::rc::Rc;

use crate::diag::{span_to_loc, Diagnostic, DiagnosticInfoMessage, DiagnosticInformation};
use crate::open_api_ast::JsonSchema;
use crate::type_to_schema::TypeToSchema;
use crate::ParsedModule;
use crate::{open_api_ast::Validator, BffFileName, FileManager};
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

pub struct BuiltDecoder {
    pub exported_name: String,
    pub schema: JsonSchema,
}

pub struct ParserExtractResult {
    pub errors: Vec<Diagnostic>,
    pub entry_file_name: BffFileName,
    pub validators: Vec<Validator>,
    pub built_decoders: Option<Vec<BuiltDecoder>>,
}

struct ExtractParserVisitor<'a, R: FileManager> {
    files: &'a mut R,
    current_file: BffFileName,
    validators: Vec<Validator>,
    errors: Vec<Diagnostic>,
    built_decoders: Option<Vec<BuiltDecoder>>,
}
impl<'a, R: FileManager> ExtractParserVisitor<'a, R> {
    fn new(files: &'a mut R, current_file: BffFileName) -> ExtractParserVisitor<'a, R> {
        ExtractParserVisitor {
            files,
            current_file,
            validators: vec![],
            errors: vec![],
            built_decoders: None,
        }
    }
}

impl<'a, R: FileManager> ExtractParserVisitor<'a, R> {
    fn build_error(&self, span: &Span, msg: DiagnosticInfoMessage) -> DiagnosticInformation {
        let file = self.files.get_existing_file(&self.current_file);
        match file {
            Some(file) => {
                let (loc_lo, loc_hi) =
                    span_to_loc(span, &file.module.source_map, file.module.fm.end_pos);

                DiagnosticInformation::KnownFile {
                    message: msg,
                    file_name: self.current_file.clone(),
                    loc_lo,
                    loc_hi,
                }
            }
            None => DiagnosticInformation::UnfoundFile {
                message: msg,
                current_file: self.current_file.clone(),
            },
        }
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
        match self.files.get_or_fetch_file(&self.current_file) {
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
                    self.push_error(
                        span,
                        DiagnosticInfoMessage::TwoDifferentTypesWithTheSameName,
                    );
                }
            } else {
                self.validators.push(d);
            }
        }
    }
    fn convert_to_json_schema(&mut self, ty: &TsType, span: &Span) -> JsonSchema {
        let mut to_schema = TypeToSchema::new(self.files, self.current_file.clone());
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
                JsonSchema::Error
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
}

impl<'a, R: FileManager> Visit for ExtractParserVisitor<'a, R> {
    fn visit_call_expr(&mut self, n: &CallExpr) {
        match n.callee {
            Callee::Super(_) => {}
            Callee::Import(_) => {}
            Callee::Expr(ref expr) => {
                if let Expr::Ident(Ident { sym, span, .. }) = &**expr {
                    if sym == "buildParsers" {
                        match self.built_decoders {
                            Some(_) => {
                                self.push_error(span, DiagnosticInfoMessage::TwoCallsToBuildParsers)
                            }
                            None => {
                                if let Some(ref params) = n.type_args {
                                    if let Ok(x) =
                                        self.extract_built_decoders_from_call(params.as_ref())
                                    {
                                        self.built_decoders = Some(x)
                                    }
                                }
                            }
                        }
                    }
                }

                if let Expr::Member(MemberExpr { prop, .. }) = &**expr {
                    match prop {
                        MemberProp::Ident(Ident { sym, span, .. }) => {
                            if sym == "buildParsers" {
                                match self.built_decoders {
                                    Some(_) => self.push_error(
                                        span,
                                        DiagnosticInfoMessage::TwoCallsToBuildParsers,
                                    ),
                                    None => {
                                        if let Some(ref params) = n.type_args {
                                            if let Ok(x) = self
                                                .extract_built_decoders_from_call(params.as_ref())
                                            {
                                                self.built_decoders = Some(x)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        MemberProp::PrivateName(_) => todo!(),
                        MemberProp::Computed(_) => todo!(),
                    }
                }
            }
        }
    }
}
type VisitExtractResult = (Vec<Diagnostic>, Vec<Validator>, Option<Vec<BuiltDecoder>>);
fn visit_extract<R: FileManager>(files: &mut R, current_file: BffFileName) -> VisitExtractResult {
    let mut visitor = ExtractParserVisitor::new(files, current_file.clone());
    let _ = visitor.visit_current_file();
    (visitor.errors, visitor.validators, visitor.built_decoders)
}

pub fn extract_parser<R: FileManager>(
    files: &mut R,
    entry_file_name: BffFileName,
) -> ParserExtractResult {
    let (errors, validators, built_decoders) = visit_extract(files, entry_file_name.clone());

    ParserExtractResult {
        errors,
        entry_file_name,
        validators,
        built_decoders,
    }
}
