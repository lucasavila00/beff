import * as fs from "fs";
import * as path from "path";
import { Bundler } from "./bundler";
import { ProjectJson, ProjectModule } from "./project";

const RUNTIME_JS_ESM = fs.readFileSync(
  path.join(__dirname, "../runtime/dist/esm/runtime.js"),
  "utf-8"
);
const RUNTIME_JS_CJS = fs.readFileSync(
  path.join(__dirname, "../runtime/dist/cjs/runtime.js"),
  "utf-8"
);
const RUNTIME_DTS_ESM = fs.readFileSync(
  path.join(__dirname, "../runtime/dist/esm/runtime.d.ts"),
  "utf-8"
);
const RUNTIME_DTS_CJS = fs.readFileSync(
  path.join(__dirname, "../runtime/dist/cjs/runtime.d.ts"),
  "utf-8"
);
const finalizeFile = (
  wasmCode: string,
  skipSharedRuntime: boolean,
  mod: ProjectModule
) => {
  if (skipSharedRuntime) {
    return wasmCode;
  }
  return [mod == "esm" ? RUNTIME_JS_ESM : RUNTIME_JS_CJS, wasmCode].join("\n");
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
    fs.writeFileSync(
      outputDts,
      mod === "esm" ? RUNTIME_DTS_ESM : RUNTIME_DTS_CJS
    );
  }
};
