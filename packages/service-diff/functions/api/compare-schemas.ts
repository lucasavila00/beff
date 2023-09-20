// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as wasmIndexBg from "../pkg/index_bg.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import wasmMod from "../pkg/index_bg.wasm";

const doInitWasm = async () => {
  const wasm = await WebAssembly.instantiate(wasmMod, {
    "./index_bg.js": wasmIndexBg,
  }).then(
    (it) =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      it.exports
  );
  wasmIndexBg.__wbg_set_wasm(wasm);
  await wasmIndexBg.init(true);
  return wasm;
};
let initWasmPromise: Promise<unknown> | null = null;
const initWasm = () => {
  if (initWasmPromise == null) {
    initWasmPromise = doInitWasm();
  }
  return initWasmPromise;
};

export type MdResponse =
  | { _tag: "Heading"; data: string }
  | { _tag: "Text"; data: string }
  | { _tag: "TsTypes"; data: string }
  | { _tag: "Json"; data: string };

export const compare_schemas = async (
  from: string,
  to: string
): Promise<MdResponse[]> => {
  await initWasm();
  return wasmIndexBg.compare_schemas(from, to);
};
