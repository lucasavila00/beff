use beff_core::{BffFileName, swc::bind_exports::FsModuleResolver};
use std::collections::HashMap;

pub struct WasmModuleResolver {
    resolutions_cache: HashMap<(BffFileName, String), Option<BffFileName>>,
}

impl WasmModuleResolver {
    pub fn new() -> WasmModuleResolver {
        WasmModuleResolver {
            resolutions_cache: HashMap::new(),
        }
    }
}

impl FsModuleResolver for WasmModuleResolver {
    fn resolve_import(
        &mut self,
        current_file: BffFileName,
        module_specifier: &str,
    ) -> Option<BffFileName> {
        let module_specifier = module_specifier.to_owned();
        match self
            .resolutions_cache
            .get(&(current_file.clone(), module_specifier.clone()))
        {
            Some(it) => it.clone(),
            None => {
                let v = crate::resolve_import(current_file.to_string().as_str(), &module_specifier)
                    .map(BffFileName::new);
                self.resolutions_cache
                    .insert((current_file.clone(), module_specifier), v.clone());
                v
            }
        }
    }
}
