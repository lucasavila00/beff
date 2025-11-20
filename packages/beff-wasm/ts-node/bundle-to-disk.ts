import * as fs from "fs";
import * as path from "path";
import { Bundler, WritableModules, WritableModulesV2 } from "./bundler";
import { ProjectJson, ProjectModule } from "./project";
import gen from "./generated/bundle";

const decodersExported = [
  "registerStringFormatter",
  "registerNumberFormatter",
  "ObjectValidator",
  "ObjectParser",
  "MappedRecordParser",
  "MappedRecordValidator",
  "ArrayParser",
  "ArrayValidator",
  "CodecDecoder",
  "StringWithFormatsDecoder",
  "NumberWithFormatsDecoder",
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
  "MappedRecordReporter",
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
  "MappedRecordSchema",
  //
  "describeString",
  "describeNumber",
  "describeBoolean",
  "describeNull",
  "describeAny",
  "describeNever",
  "describeFunction",
  "ArrayDescribe",
  "ObjectDescribe",
  "TupleDescribe",
  "AnyOfDescribe",
  "AllOfDescribe",
  "AnyOfDiscriminatedDescribe",
  "MappedRecordDescribe",
  "wrap_describe",
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
  const exportedItems = [
    ...decodersExported,
    "validators",
    "parsers",
    "reporters",
    "schemas",
    "describers",
  ].join(", ");
  const exports = [exportCode(mod), `{ ${exportedItems} };`].join(" ");
  return [
    //
    "//@ts-nocheck",
    gen["decoders.js"],
    esmTag(mod),
    wasmCode.js_validators,
    exports,
  ].join("\n");
};

const importValidators = (mod: ProjectModule) => {
  const i = [...decodersExported, "validators", "parsers", "reporters", "schemas", "describers", "c"].join(
    ", ",
  );

  const importRest =
    mod === "esm"
      ? `import {printErrors} from '@beff/client';\nimport {z} from 'zod';\nimport validatorsMod from "./validators.js"; const { ${i} } = validatorsMod;`
      : `const {printErrors} = require('beff/client');\nconst {z} = require('zod');\nconst { ${i} } = require('./validators.js').default;`;

  return [importRest].join("\n");
};

const finalizeParserFile = (
  wasmCode: WritableModules,
  mod: ProjectModule,
  stringFormats: string[],
  numberFormats: string[],
) => {
  const exportedItems = ["buildParsers"].join(", ");
  const exports = [exportCode(mod), `{ ${exportedItems} };`].join(" ");

  const stringFormatsCode = `const RequiredStringFormats = ${JSON.stringify(stringFormats)};`;
  const numberFormatsCode = `const RequiredNumberFormats = ${JSON.stringify(numberFormats)};`;
  return [
    "//@ts-nocheck",
    esmTag(mod),
    importValidators(mod),
    stringFormatsCode,
    numberFormatsCode,
    wasmCode.js_built_parsers,
    gen["build-parsers.js"],
    exports,
  ].join("\n");
};

const V2_ESM_IMPORT = `import {
  printErrors
} from "@beff/client";`;
const finalizeParserV2File = (
  wasmCode: WritableModulesV2,
  mod: ProjectModule,
  stringFormats: string[],
  numberFormats: string[],
) => {
  const exportedItems = ["buildParsers"].join(", ");
  const exports = [exportCode(mod), `{ ${exportedItems} };`].join(" ");

  const stringFormatsCode = `const RequiredStringFormats = ${JSON.stringify(stringFormats)};`;
  const numberFormatsCode = `const RequiredNumberFormats = ${JSON.stringify(numberFormats)};`;

  let genV2 = gen["codegen-v2.js"];
  let zod_import = `import { z } from "zod";`;

  if (mod == "cjs") {
    zod_import = `const { z } = require("zod");`;
    genV2 = genV2.replace(V2_ESM_IMPORT, `const { printErrors } = require("@beff/client");`);
  }

  return [
    "//@ts-nocheck",
    esmTag(mod),
    stringFormatsCode,
    numberFormatsCode,
    wasmCode.js_built_parsers,
    zod_import,
    genV2,
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

  switch (projectJson.codegen) {
    case 1: {
      const outResult = bundler.bundle(parserEntryPoint, projectJson.settings);
      if (outResult == null) {
        return "failed";
      }

      fs.writeFileSync(path.join(outputDir, "validators.js"), finalizeValidatorsCode(outResult, mod));

      if (projectJson.parser) {
        fs.writeFileSync(
          path.join(outputDir, "parser.js"),
          finalizeParserFile(
            outResult,
            mod,
            projectJson.settings.stringFormats.map((it) => it.name) ?? [],
            projectJson.settings.numberFormats.map((it) => it.name) ?? [],
          ),
        );
        fs.writeFileSync(path.join(outputDir, "parser.d.ts"), gen["parser.d.ts"]);
      }
      return "ok";
    }
    case 2: {
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
    }
    default: {
      throw `Unsupported codegen version: ${projectJson.codegen}`;
    }
  }
};
