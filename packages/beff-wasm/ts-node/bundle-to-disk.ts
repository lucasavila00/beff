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

// The names that the printed code uses from the runtime.
const runtimeImports = [
  "TypeofRuntype",
  "AnyRuntype",
  "NullishRuntype",
  "NeverRuntype",
  "ConstRuntype",
  "RegexRuntype",
  "DateRuntype",
  "BigIntRuntype",
  "StringWithFormatRuntype",
  "NumberWithFormatRuntype",
  "AnyOfConstsRuntype",
  "TupleRuntype",
  "AllOfRuntype",
  "AnyOfRuntype",
  "ArrayRuntype",
  "AnyOfDiscriminatedRuntype",
  "ObjectRuntype",
  "OptionalFieldRuntype",
  "RefRuntype",
  "TypedArrayRuntype",
  "MapRuntype",
  "SetRuntype",
  "NumberKeyRuntype",
  "buildParsers",
];

const importCode = (mod: ProjectModule) => {
  const names = runtimeImports.map((it) => `  ${it},`).join("\n");
  if (mod === "cjs") {
    return `const {\n${names}\n} = require("@beff/client/runtime");`;
  }
  return `import {\n${names}\n} from "@beff/client/runtime";`;
};

const finalizeParserV2File = (
  wasmCode: string,
  mod: ProjectModule,
  stringFormats: string[],
  numberFormats: string[],
) => {
  const exports = `${exportCode(mod)} {
  buildParsers: (args) =>
    buildParsers(
      {
        parsers: buildParsersInput,
        stringFormatters,
        numberFormatters,
        requiredStringFormats: RequiredStringFormats,
        requiredNumberFormats: RequiredNumberFormats,
      },
      args,
    ),
};`;

  const stringFormatsCode = `const RequiredStringFormats = ${JSON.stringify(stringFormats)};`;
  const numberFormatsCode = `const RequiredNumberFormats = ${JSON.stringify(numberFormats)};`;

  return [
    //
    "//@ts-nocheck",
    esmTag(mod),
    importCode(mod),
    stringFormatsCode,
    numberFormatsCode,
    wasmCode,
    exports,
  ].join("\n");
};

const writeIfChanged = (filePath: string, content: string) => {
  if (fs.existsSync(filePath)) {
    const existingContent = fs.readFileSync(filePath, "utf-8");
    if (existingContent === content) {
      return;
    }
  }
  fs.writeFileSync(filePath, content);
};

const logTiming = (verbose: boolean, label: string, start: number) => {
  if (verbose) {
    console.log(`JS: Timing ${label} ${Date.now() - start}ms`);
  }
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
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const bundleStart = Date.now();
  const outResult = bundler.bundle_v2(parserEntryPoint, projectJson.settings);
  logTiming(verbose, "WASM extraction/codegen", bundleStart);
  if (outResult == null) {
    return "failed";
  }
  const finalizeStart = Date.now();
  const parserJs = finalizeParserV2File(
    outResult,
    mod,
    projectJson.settings.stringFormats.map((it) => it.name) ?? [],
    projectJson.settings.numberFormats.map((it) => it.name) ?? [],
  );
  const parserDts = gen["parser.d.ts"];
  logTiming(verbose, "output finalization", finalizeStart);

  const writeStart = Date.now();
  writeIfChanged(path.join(outputDir, "parser.js"), parserJs);
  writeIfChanged(path.join(outputDir, "parser.d.ts"), parserDts);
  logTiming(verbose, "disk writes", writeStart);
  return "ok";
};
