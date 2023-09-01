import * as fs from "fs";
import * as path from "path";
import { Bundler } from "./bundler";
import { ProjectJson, ProjectModule } from "./project";

const RUNTIME_JS_ESM = fs.readFileSync(
  path.join(__dirname, "../runtime/dist/hono-esm.js"),
  "utf-8"
);
const RUNTIME_JS_CJS = fs.readFileSync(
  path.join(__dirname, "../runtime/dist/hono-cjs.js"),
  "utf-8"
);
const RUNTIME_DTS = fs.readFileSync(
  path.join(__dirname, "../runtime/hono-runtime.d.ts"),
  "utf-8"
);

const decodersCode = `
class CoercionFailure {}
function add_path_to_errors(errors, path) {
  return errors.map((e) => ({ ...e, path: [...path, ...e.path] }));
}
function coerce_string(input) {
  return input;
}
const isNumeric = (num) =>
  (typeof num === "number" || (typeof num === "string" && num.trim() !== "")) &&
  !isNaN(num );
function coerce_number(input) {
  if (isNumeric(input)) {
    return Number(input);
  }
  return new CoercionFailure();
}
function coerce_boolean(input) {
  if (input === "true" || input === "false") {
    return input === "true";
  }
  if (input === "1" || input === "0") {
    return input === "1";
  }
  return new CoercionFailure();
}
function coerce_union(input, ...cases) {
  for (const c of cases) {
    const r = coerce(c, input);
    if (!(r instanceof CoercionFailure)) {
      return r;
    }
  }
  return new CoercionFailure();
}

`;
const finalizeFile = (
  wasmCode: string,
  skipSharedRuntime: boolean,
  mod: ProjectModule
) => {
  if (skipSharedRuntime) {
    return wasmCode;
  }
  return [
    decodersCode,
    wasmCode,
    mod == "esm" ? RUNTIME_JS_ESM : RUNTIME_JS_CJS,
  ].join("\n");
};

export const execProject = (
  projectPath: string,
  projectJson: ProjectJson,
  verbose: boolean,
  skipSharedRuntime: boolean
) => {
  const mod = projectJson.module ?? "esm";
  const bundler = new Bundler(verbose, mod);
  const entryPoint = path.join(path.dirname(projectPath), projectJson.router);
  const outString = bundler.bundle(entryPoint);
  if (outString == null) {
    process.exit(1);
  }
  const outputDir = path.join(path.dirname(projectPath), projectJson.outputDir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const outputFile = path.join(outputDir, "index.js");
  const finalFile = finalizeFile(outString, skipSharedRuntime, mod);
  fs.writeFileSync(outputFile, finalFile);

  if (!skipSharedRuntime) {
    const outputDts = path.join(outputDir, "index.d.ts");
    fs.writeFileSync(outputDts, RUNTIME_DTS);
  }
};
