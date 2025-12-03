import * as fs from "fs";
import * as path from "path";
import { Bundler } from "./bundler";
import { ProjectJson, ProjectModule } from "./project";
import gen from "./generated/bundle";

const esmTag = (mod: ProjectModule) => {
  if (mod === "cjs") {
    return `
Object.defineProperty(exports, "__esModule", {
  value: true
});
    `;
  }
  return "";
};

const exportCode = (mod: ProjectModule) => (mod === "esm" ? "export default" : "exports.default =");

const finalizeParserV2File = (
  wasmCode: string,
  mod: ProjectModule,
  stringFormats: string[],
  numberFormats: string[],
) => {
  const exportedItems = ["buildParsers"].join(", ");
  const exports = [exportCode(mod), `{ ${exportedItems} };`].join(" ");

  const stringFormatsCode = `const RequiredStringFormats = ${JSON.stringify(stringFormats)};`;
  const numberFormatsCode = `const RequiredNumberFormats = ${JSON.stringify(numberFormats)};`;

  let genV2 = gen["codegen-v2.js"];
  if (mod === "cjs") {
    genV2 = genV2
      .replace("import {", "const {")
      .replace('} from "@beff/client/codegen-v2";', '} = require("@beff/client/codegen-v2");');
  }

  let zod_import = `import { z } from "zod";`;

  if (mod == "cjs") {
    zod_import = `const { z } = require("zod");`;
  }

  return [
    "//@ts-nocheck",
    esmTag(mod),
    zod_import,
    genV2,
    stringFormatsCode,
    numberFormatsCode,
    wasmCode,
    exports,
  ].join("\n");
};

export const execProject = (
  bundler: Bundler,
  projectPath: string,
  projectJson: ProjectJson,
  verbose: boolean,
): "ok" | "failed" => {
  const mod = projectJson.module ?? "esm";

  const parserEntryPoint = projectJson.parser
    ? path.join(path.dirname(projectPath), projectJson.parser)
    : undefined;
  if (verbose) {
    console.log(`JS: Parser entry point ${parserEntryPoint}`);
  }

  const outputDir = path.join(path.dirname(projectPath), projectJson.outputDir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const outResult = bundler.bundle_v2(parserEntryPoint, projectJson.settings);
  if (outResult == null) {
    return "failed";
  }
  fs.writeFileSync(
    path.join(outputDir, "parser.js"),
    finalizeParserV2File(
      outResult,
      mod,
      projectJson.settings.stringFormats.map((it) => it.name) ?? [],
      projectJson.settings.numberFormats.map((it) => it.name) ?? [],
    ),
  );
  fs.writeFileSync(path.join(outputDir, "parser.d.ts"), gen["parser.d.ts"]);
  return "ok";
};
