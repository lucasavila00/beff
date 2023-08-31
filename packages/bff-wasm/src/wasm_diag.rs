use bff_core::diag::Diagnostic;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct WasmDiagnosticItem {
    message: String,
    file_name: String,

    line_lo: usize,
    col_lo: usize,
    line_hi: usize,
    col_hi: usize,
}
#[derive(Serialize, Deserialize)]
pub struct WasmDiagnostic {
    diagnostics: Vec<WasmDiagnosticItem>,
}

impl WasmDiagnostic {
    pub fn from_diagnostics(diagnostics: Vec<Diagnostic>) -> WasmDiagnostic {
        WasmDiagnostic {
            diagnostics: diagnostics.into_iter().map(diag_to_wasm).collect(),
        }
    }
}

fn diag_to_wasm(diag: Diagnostic) -> WasmDiagnosticItem {
    WasmDiagnosticItem {
        message: format!("{:?}", diag.message),
        file_name: diag.file_name.to_string(),
        col_hi: diag.loc_hi.col.0,
        col_lo: diag.loc_lo.col.0,
        line_hi: diag.loc_hi.line,
        line_lo: diag.loc_lo.line,
    }
}
