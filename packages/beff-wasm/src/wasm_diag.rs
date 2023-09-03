use beff_core::diag::{Diagnostic, DiagnosticInformation};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub enum WasmDiagnosticInformation {
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

impl WasmDiagnosticInformation {
    pub fn from_diagnostic_info(info: DiagnosticInformation) -> WasmDiagnosticInformation {
        match info {
            DiagnosticInformation::KnownFile {
                message,
                file_name,
                loc_lo,
                loc_hi,
            } => WasmDiagnosticInformation::KnownFile {
                message: message.to_string(),
                file_name: file_name.to_string(),
                line_lo: loc_lo.line,
                col_lo: loc_lo.col.0,
                line_hi: loc_hi.line,
                col_hi: loc_hi.col.0,
            },
            DiagnosticInformation::UnfoundFile {
                message,
                current_file,
            } => WasmDiagnosticInformation::UnknownFile {
                message: message.to_string(),
                current_file: current_file.to_string(),
            },
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct WasmDiagnosticItem {
    cause: WasmDiagnosticInformation,
    related_information: Option<Vec<WasmDiagnosticInformation>>,
    message: Option<String>,
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
        cause: WasmDiagnosticInformation::from_diagnostic_info(diag.cause),
        related_information: match diag.related_information {
            Some(it) => Some(
                it.into_iter()
                    .map(WasmDiagnosticInformation::from_diagnostic_info)
                    .collect(),
            ),
            None => None,
        },
        message: diag.message.map(|it| it.to_string()),
    }
}
