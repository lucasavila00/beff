use crate::ast::runtype::Runtype;
use crate::diag::{DiagnosticInfoMessage, DiagnosticInformation, Location};
use crate::frontend::FrontendCtx;
use crate::{BeffUserSettings, ParsedModule, RuntypeUUID};
use crate::{BffFileName, FileManager, NamedSchema};
use anyhow::Result;
use anyhow::anyhow;
use std::collections::BTreeSet;
use std::rc::Rc;
use swc_common::{DUMMY_SP, Span};
use swc_ecma_ast::{CallExpr, Callee, Expr, Ident, MemberExpr, MemberProp};
use swc_ecma_visit::Visit;

#[derive(Debug)]
pub struct BuiltDecoder {
    pub exported_name: String,
    pub schema: Runtype,
}

#[derive(Debug)]
pub struct ParserExtractResult {
    pub errors: Vec<DiagnosticInformation>,
    pub entry_file_name: BffFileName,
    pub validators: Vec<NamedSchema>,
    pub built_decoders: Option<Vec<BuiltDecoder>>,
    pub counter: usize,
    pub recursive_generic_uuids: BTreeSet<RuntypeUUID>,
}

struct ExtractParserVisitor<'a, R: FileManager> {
    files: &'a mut R,
    current_file: BffFileName,
    validators: Vec<NamedSchema>,
    errors: Vec<DiagnosticInformation>,
    built_decoders: Option<Vec<BuiltDecoder>>,
    settings: &'a BeffUserSettings,
    counter: usize,
    recursive_generic_uuids: BTreeSet<RuntypeUUID>,
}
impl<'a, R: FileManager> ExtractParserVisitor<'a, R> {
    fn new(
        files: &'a mut R,
        current_file: BffFileName,
        settings: &'a BeffUserSettings,
    ) -> ExtractParserVisitor<'a, R> {
        ExtractParserVisitor {
            files,
            current_file,
            validators: vec![],
            errors: vec![],
            built_decoders: None,
            settings,
            counter: 0,
            recursive_generic_uuids: BTreeSet::new(),
        }
    }
}

impl<R: FileManager> ExtractParserVisitor<'_, R> {
    fn build_error(&self, span: &Span, msg: DiagnosticInfoMessage) -> DiagnosticInformation {
        let file = self.files.get_existing_file(&self.current_file);
        Location::build(file, span, &self.current_file).to_info(msg)
    }
    fn push_error(&mut self, span: &Span, msg: DiagnosticInfoMessage) {
        self.errors.push(self.build_error(span, msg));
    }

    fn get_current_file(&mut self) -> Result<Rc<ParsedModule>> {
        let res = self.files.get_or_fetch_file(&self.current_file);

        match res {
            Some(it) => Ok(it),
            None => {
                self.errors.push(self.build_error(
                    &DUMMY_SP,
                    DiagnosticInfoMessage::CannotNotFindFile(self.current_file.clone()),
                ));
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

    fn extend_components(&mut self, defs: Vec<NamedSchema>, span: &Span) {
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
    fn extract_special_calls(&mut self, id: &Ident, n: &CallExpr) {
        let Ident { sym, span, .. } = id;
        if sym == "buildParsers" {
            match self.built_decoders {
                Some(_) => self.push_error(span, DiagnosticInfoMessage::TwoCallsToBuildParsers),
                None => {
                    if let Some(ref params) = n.type_args {
                        let mut ctx =
                            FrontendCtx::new(self.files, self.current_file.clone(), self.settings);

                        if let Ok(x) = ctx.extract_built_decoders_from_call_v2(params.as_ref()) {
                            self.built_decoders = Some(x)
                        }
                        self.recursive_generic_uuids = ctx.recursive_generic_uuids;
                        self.errors.extend(ctx.errors);
                        let mut kvs = vec![];
                        for (k, v) in ctx.partial_validators {
                            // We store type in an Option to support self-recursion.
                            // When we encounter the type while transforming it we return string with the type name.
                            // And we need the option to allow a type to refer to itself before it has been resolved.
                            match v {
                                Some(s) => kvs.push((k, s)),
                                None => self.push_error(
                                    span,
                                    DiagnosticInfoMessage::CannotResolveTypeReferenceOnExtracting(
                                        k,
                                    ),
                                ),
                            }
                        }

                        kvs.sort_by(|(ka, _), (kb, _)| ka.cmp(kb));
                        let mut ext: Vec<NamedSchema> = vec![];
                        for (k, b) in kvs.into_iter() {
                            ext.push(NamedSchema { name: k, schema: b });
                        }
                        self.extend_components(ext, span);
                    }
                }
            }
        }
    }
}

impl<R: FileManager> Visit for ExtractParserVisitor<'_, R> {
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

pub fn extract_parser<R: FileManager>(
    files: &mut R,
    entry_file_name: BffFileName,
    settings: &BeffUserSettings,
) -> ParserExtractResult {
    let (errors, validators, built_decoders, counter, recursive_generic_uuids) = {
        let mut visitor = ExtractParserVisitor::new(files, entry_file_name.clone(), settings);
        let _ = visitor.visit_current_file();
        (
            visitor.errors,
            visitor.validators,
            visitor.built_decoders,
            visitor.counter,
            visitor.recursive_generic_uuids,
        )
    };

    ParserExtractResult {
        errors,
        entry_file_name,
        validators,
        built_decoders,
        counter,
        recursive_generic_uuids,
    }
}
