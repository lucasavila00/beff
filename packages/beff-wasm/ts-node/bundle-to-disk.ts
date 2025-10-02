import * as fs from "fs";
import * as path from "path";
import { Bundler, WritableModules } from "./bundler";
import { ProjectJson, ProjectModule } from "./project";
import gen from "./generated/bundle";

const decodersExported = [
  "registerCustomFormatter",
  "ObjectValidator",
  "ObjectParser",
  "ArrayParser",
  "ArrayValidator",
  "CodecDecoder",
  "StringWithFormatDecoder",
  "AnyOfValidator",
  "AnyOfParser",
  "AllOfValidator",
  "AllOfParser",
  "TupleParser",
  "TupleValidator",
  "RegexDecoder",
  "ConstDecoder",
  "AnyOfConstsDecoder",
  "AnyOfDiscriminatedParser",
  "AnyOfDiscriminatedValidator",
  "validateString",
  "validateNumber",
  "validateFunction",
  "validateBoolean",
  "validateAny",
  "validateNull",
  "validateNever",
  "parseIdentity",
  //
  "reportString",
  "reportNumber",
  "reportNull",
  "reportBoolean",
  "reportAny",
  "reportNever",
  "reportFunction",
  "ArrayReporter",
  "ObjectReporter",
  "TupleReporter",
  "AnyOfReporter",
  "AllOfReporter",
  "AnyOfDiscriminatedReporter",
  //
  "schemaString",
  "schemaNumber",
  "schemaBoolean",
  "schemaNull",
  "schemaAny",
  "schemaNever",
  "schemaFunction",
  "ArraySchema",
  "ObjectSchema",
  "TupleSchema",
  "AnyOfSchema",
  "AllOfSchema",
  "AnyOfDiscriminatedSchema",
];

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

const finalizeValidatorsCode = (wasmCode: WritableModules, mod: ProjectModule) => {
  const exportedItems = [...decodersExported, "validators", "parsers", "reporters", "schemas"].join(", ");
  const exports = [exportCode(mod), `{ ${exportedItems} };`].join(" ");
  return [
    "//@ts-nocheck\n/* eslint-disable */\n",
    gen["decoders.js"],
    esmTag(mod),
    wasmCode.js_validators,
    exports,
  ].join("\n");
};

const importValidators = (mod: ProjectModule) => {
  const i = [...decodersExported, "validators", "parsers", "reporters", "schemas", "c"].join(", ");

  const importRest =
    mod === "esm"
      ? `import {printErrors} from '@beff/client';\nimport {z} from 'zod';\nimport validatorsMod from "./validators.js"; const { ${i} } = validatorsMod;`
      : `const {printErrors} = require('beff/client');\nconst {z} = require('zod');\nconst { ${i} } = require('./validators.js').default;`;

  return [importRest].join("\n");
};

const finalizeParserFile = (wasmCode: WritableModules, mod: ProjectModule, stringFormats: string[]) => {
  const exportedItems = ["buildParsers"].join(", ");
  const exports = [exportCode(mod), `{ ${exportedItems} };`].join(" ");

  const stringFormatsCode = `const RequiredStringFormats = ${JSON.stringify(stringFormats)};`;
  return [
    "//@ts-nocheck\n/* eslint-disable */\n",
    esmTag(mod),
    importValidators(mod),
    stringFormatsCode,
    wasmCode.js_built_parsers,
    gen["build-parsers.js"],
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
    // eslint-disable-next-line no-console
    console.log(`JS: Parser entry point ${parserEntryPoint}`);
  }
  const outResult = bundler.bundle(parserEntryPoint, projectJson.settings);
  if (outResult == null) {
    return "failed";
  }
  const outputDir = path.join(path.dirname(projectPath), projectJson.outputDir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  fs.writeFileSync(path.join(outputDir, "validators.js"), finalizeValidatorsCode(outResult, mod));

  if (projectJson.parser) {
    fs.writeFileSync(
      path.join(outputDir, "parser.js"),
      finalizeParserFile(outResult, mod, projectJson.settings.stringFormats.map((it) => it.name) ?? []),
    );
    fs.writeFileSync(
      path.join(outputDir, "parser.d.ts"),
      ["/* eslint-disable */\n", gen["parser.d.ts"]].join("\n"),
    );
  }
  return "ok";
};
