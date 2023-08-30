import { it, expect } from "vitest";
import wasm from "../pkg/hello_wasm";
import fs from "fs";
import path from "path";
import resolve from "enhanced-resolve";

const isRelativeImport = (mod: string) => {
  return mod.startsWith("./") || mod.startsWith("../") || mod.startsWith("/");
};

const myResolve = resolve.create.sync({
  // or resolve.create.sync
  extensions: [".ts", ".tsx", ".d.ts"],
  // see more options below
});

const resolveRelativeImport = (
  file_name: string,
  mod: string
): string | undefined => {
  const result = myResolve(path.dirname(file_name), mod);
  if (result) {
    console.log(`JS: Resolved import to: ${result}`);
    return result;
  }
  console.error(`JS: File could not be resolved: ${mod}`);
  return undefined;
};

const resolveImportNoCache = (
  file_name: string,
  mod: string
): string | undefined => {
  console.log(`JS: Resolving -import ? from '${mod}'- at ${file_name}`);
  if (isRelativeImport(mod)) {
    return resolveRelativeImport(file_name, mod);
  }

  console.error(`JS: File is not relative: ${mod}`);
  return undefined;
};
const resolvedCache = new Map<string, string>();
const resolveImport = (file_name: string, mod: string): string | undefined => {
  const cacheKey = `${file_name}::${mod}`;
  if (resolvedCache.has(cacheKey)) {
    return resolvedCache.get(cacheKey);
  }
  const result = resolveImportNoCache(file_name, mod);
  if (result) {
    resolvedCache.set(cacheKey, result);
  }
  return result;
};
globalThis.resolve_import = resolveImport;
class Bundler {
  seenFiles: Set<string> = new Set();
  constructor() {
    wasm.init();
  }

  private readFile(file_name: string): string {
    console.log(`JS: Reading file ${file_name}`);
    return fs.readFileSync(file_name, "utf-8");
  }

  private parseSourceFileRecursive(file_name: string) {
    if (this.seenFiles.has(file_name)) {
      return;
    }
    this.seenFiles.add(file_name);
    const source_file = this.readFile(file_name);
    wasm.parse_source_file(file_name, source_file);
    const nextFiles: string[] = wasm.read_files_to_import();
    wasm.clear_files_to_import();
    for (const file of nextFiles) {
      this.parseSourceFileRecursive(file);
    }
  }

  public bundle(file_name: string): string {
    this.parseSourceFileRecursive(file_name);
    return wasm.bundle_to_string(file_name);
  }
}
it("works", async () => {
  const start = Date.now();
  const fixtureA = path.join(__dirname, "../fixtures/a/simple.ts");
  const bundler = new Bundler();
  const outString = bundler.bundle(fixtureA);
  expect(outString).toMatchInlineSnapshot(`
    "export const meta = {
        \\"handlersMeta\\": [
            {
                \\"method_kind\\": \\"get\\",
                \\"params\\": [],
                \\"pattern\\": \\"/hello\\",
                \\"return_validator\\": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != \\"string\\") {
                        error_acc_0.push({
                            \\"kind\\": [
                                \\"NotTypeof\\",
                                \\"string\\"
                            ],
                            \\"path\\": [
                                \\"[GET] /hello.response_body\\"
                            ]
                        });
                    }
                    return error_acc_0;
                }
            }
        ],
        \\"schema\\": {
            \\"openapi\\": \\"3.1.0\\",
            \\"info\\": {
                \\"title\\": \\"No title\\",
                \\"version\\": \\"0.0.0\\"
            },
            \\"paths\\": {
                \\"/hello\\": {
                    \\"get\\": {
                        \\"parameters\\": [],
                        \\"responses\\": {
                            \\"200\\": {
                                \\"description\\": \\"successful operation\\",
                                \\"content\\": {
                                    \\"application/json\\": {
                                        \\"schema\\": {
                                            \\"type\\": \\"string\\"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            \\"components\\": {
                \\"schemas\\": {}
            }
        }
    };
    "
  `);
  const end = Date.now();
  console.log(`Bundled in ${end - start}ms`);

  //   const wasmBuffer = fs.readFileSync(
  //     path.join(__dirname, "../pkg/hello_wasm_bg.wasm")
  //   );
  //   console.log({ wasmBuffer });
  //   const wasmModule = await WebAssembly.instantiate(wasmBuffer, {});
  //   // Exported function live under instance.exports
  //   const e: any = wasmModule.instance.exports;
  //   e.init();
  //   console.log(WebAssembly);
});
