import * as fs from "fs";
import * as path from "path";
import { Bundler } from "./bundler";
import { ProjectJson } from "./project";

const RUNTIME_JS = fs.readFileSync(
  path.join(__dirname, "../runtime/dist/runtime.js"),
  "utf-8"
);
const finalizeFile = (wasmCode: string, skipSharedRuntime: boolean) => {
  if (skipSharedRuntime) {
    return wasmCode;
  }
  return [RUNTIME_JS, wasmCode].join("\n");
};

export const execProject = (
  projectPath: string,
  projectJson: ProjectJson,
  verbose: boolean,
  skipSharedRuntime: boolean
) => {
  const bundler = new Bundler(verbose);
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
  const finalFile = finalizeFile(outString, skipSharedRuntime);
  fs.writeFileSync(outputFile, finalFile);
};
