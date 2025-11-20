use anyhow::Result;
use serde::{Deserialize, Serialize};

use crate::ExtractResult;

#[derive(Serialize, Deserialize)]
pub struct WritableParser {
    pub js_built_parsers: String,
}
pub trait ToWritableParser {
    fn to_module(self) -> Result<WritableParser>;
}

impl ToWritableParser for ExtractResult {
    fn to_module(self) -> Result<WritableParser> {
        todo!()
    }
}
