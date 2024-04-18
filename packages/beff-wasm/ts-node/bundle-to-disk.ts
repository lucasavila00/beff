import * as fs from "fs";
import * as path from "path";
import { Bundler, WritableModules } from "./bundler";
import { ProjectJson, ProjectModule } from "./project";
import gen from "./generated/bundle";

const decodersExported = [
  "decodeObject",
  "decodeArray",
  "decodeString",
  "decodeNumber",
  "decodeCodec",
  "decodeStringWithFormat",
  "decodeAnyOf",
  "decodeAllOf",
  "decodeBoolean",
  "decodeAny",
  "decodeTuple",
  "decodeNull",
  "decodeConst",
  "encodeCodec",
  "encodeAnyOf",
  "encodeAllOf",
  "encodeNumber",
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
  const exportedItems = [...decodersExported, "validators", "encoders"].join(", ");
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
  const i = [...decodersExported, "validators", "encoders", "c"].join(", ");
  return mod === "esm"
    ? `import validatorsMod from "./validators.js"; const { ${i} } = validatorsMod;`
    : `const { ${i} } = require('./validators.js').default;`;
};
const finalizeRouterFile = (wasmCode: WritableModules, mod: ProjectModule) => {
  const schema = ["const schema = ", wasmCode.json_schema, ";"].join(" ");
  const exportedItems = ["meta", "schema"].join(", ");
  const exports = [exportCode(mod), `{ ${exportedItems} };`].join(" ");
  return [
    "//@ts-nocheck\n/* eslint-disable */\n",
    esmTag(mod),
    importValidators(mod),
    wasmCode.js_server_meta,
    schema,
    exports,
  ].join("\n");
};

const finalizeParserFile = (wasmCode: WritableModules, mod: ProjectModule) => {
  const exportedItems = ["buildParsers"].join(", ");
  const exports = [exportCode(mod), `{ ${exportedItems} };`].join(" ");
  return [
    "//@ts-nocheck\n/* eslint-disable */\n",
    esmTag(mod),
    importValidators(mod),
    wasmCode.js_built_parsers,
    gen["build-parsers.js"],
    exports,
  ].join("\n");
};

export const execProject = (
  bundler: Bundler,
  projectPath: string,
  projectJson: ProjectJson,
  verbose: boolean
): "ok" | "failed" => {
  const mod = projectJson.module ?? "esm";

  const routerEntryPoint = projectJson.router
    ? path.join(path.dirname(projectPath), projectJson.router)
    : undefined;
  const parserEntryPoint = projectJson.parser
    ? path.join(path.dirname(projectPath), projectJson.parser)
    : undefined;

  if (verbose) {
    // eslint-disable-next-line no-console
    console.log(`JS: Router entry point ${routerEntryPoint}`);
    // eslint-disable-next-line no-console
    console.log(`JS: Parser entry point ${parserEntryPoint}`);
  }
  const outResult = bundler.bundle(routerEntryPoint, parserEntryPoint, projectJson.settings);
  if (outResult == null) {
    return "failed";
  }
  const outputDir = path.join(path.dirname(projectPath), projectJson.outputDir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  fs.writeFileSync(path.join(outputDir, "validators.js"), finalizeValidatorsCode(outResult, mod));

  if (projectJson.router) {
    fs.writeFileSync(path.join(outputDir, "router.js"), finalizeRouterFile(outResult, mod));
    fs.writeFileSync(
      path.join(outputDir, "router.d.ts"),
      ["/* eslint-disable */\n", gen["router.d.ts"]].join("\n")
    );
    fs.writeFileSync(path.join(outputDir, "openapi.json"), outResult.json_schema ?? "");
  }

  if (projectJson.parser) {
    fs.writeFileSync(path.join(outputDir, "parser.js"), finalizeParserFile(outResult, mod));
    fs.writeFileSync(
      path.join(outputDir, "parser.d.ts"),
      ["/* eslint-disable */\n", gen["parser.d.ts"]].join("\n")
    );
  }
  return "ok";
};
