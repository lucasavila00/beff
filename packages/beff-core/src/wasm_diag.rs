use crate::diag::{Diagnostic, DiagnosticInformation, Location};
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
    pub fn from_diagnostic_info(info: &DiagnosticInformation) -> WasmDiagnosticInformation {
        match info.loc {
            Location::Full(ref f) => WasmDiagnosticInformation::KnownFile {
                message: info.message.clone().to_string(),
                file_name: f.file_name.to_string(),
                line_lo: f.loc_lo.line,
                col_lo: f.loc_lo.col.0,
                line_hi: f.loc_hi.line,
                col_hi: f.loc_hi.col.0,
            },
            Location::Unknown(ref u) => WasmDiagnosticInformation::UnknownFile {
                message: info.message.clone().to_string(),
                current_file: u.current_file.to_string(),
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
    pub fn from_diagnostics(diagnostics: Vec<&Diagnostic>) -> WasmDiagnostic {
        WasmDiagnostic {
            diagnostics: diagnostics.into_iter().map(diag_to_wasm).collect(),
        }
    }
}

fn diag_to_wasm(diag: &Diagnostic) -> WasmDiagnosticItem {
    WasmDiagnosticItem {
        cause: WasmDiagnosticInformation::from_diagnostic_info(&diag.cause),
        related_information: diag.related_information.as_ref().map(|it| {
            it.iter()
                .map(WasmDiagnosticInformation::from_diagnostic_info)
                .collect()
        }),
        message: diag.parent_big_message.as_ref().map(|it| it.to_string()),
    }
}
