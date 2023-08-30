import { it, expect } from "vitest";
import { Bundler } from "../cli/bundler";
import path from "path";

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
