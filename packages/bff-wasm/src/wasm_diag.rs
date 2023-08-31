use bff_core::diag::Diagnostic;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub enum WasmDiagnosticItem {
    KnownFile {
        message: String,
        file_name: String,

        line_lo: usize,
        col_lo: usize,
        line_hi: usize,
        col_hi: usize,
    },
    UnknownFile {
        message: String,
        current_file: String,
    },
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
    match diag {
        Diagnostic::KnownFile {
            message,
            file_name,
            loc_lo,
            loc_hi,
            ..
        } => WasmDiagnosticItem::KnownFile {
            message: format!("{:?}", message),
            file_name: file_name.to_string(),
            col_hi: loc_hi.col.0,
            col_lo: loc_lo.col.0,
            line_hi: loc_hi.line,
            line_lo: loc_lo.line,
        },
        Diagnostic::UnknownFile {
            message,
            current_file,
        } => WasmDiagnosticItem::UnknownFile {
            message: format!("{:?}", message),
            current_file: current_file.to_string(),
        },
    }
}
