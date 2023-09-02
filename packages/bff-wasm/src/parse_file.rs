use bff_core::BffFileName;
use bff_core::ImportResolver;
use std::collections::HashMap;

pub struct WasmImportsResolver {
    resolutions_cache: HashMap<(BffFileName, String), Option<BffFileName>>,
    current_file: BffFileName,
}

impl WasmImportsResolver {
    pub fn new(current_file: BffFileName) -> WasmImportsResolver {
        WasmImportsResolver {
            resolutions_cache: HashMap::new(),
            current_file,
        }
    }
}

impl ImportResolver for WasmImportsResolver {
    fn resolve_import(&mut self, module_specifier: &str) -> Option<BffFileName> {
        let module_specifier = module_specifier.to_owned();
        match self
            .resolutions_cache
            .get(&(self.current_file.clone(), module_specifier.clone()))
        {
            Some(it) => it.clone(),
            None => {
                let v = crate::resolve_import(
                    self.current_file.to_string().as_str(),
                    &module_specifier,
                )
                .map(BffFileName::new);
                self.resolutions_cache
                    .insert((self.current_file.clone(), module_specifier), v.clone());
                v
            }
        }
    }
}
