use anyhow::Result;
use serde::{Deserialize, Serialize};

use crate::ExtractResult;

#[derive(Serialize, Deserialize)]
pub struct WritableModulesV2 {
    pub js_built_parsers: String,
}
pub trait ToWritableParser {
    fn to_module_v2(self) -> Result<WritableModulesV2>;
}

impl ToWritableParser for ExtractResult {
    fn to_module_v2(self) -> Result<WritableModulesV2> {
        panic!("to_module_v2 not implemented yet");
    }
}
