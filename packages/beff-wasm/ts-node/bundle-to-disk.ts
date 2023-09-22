import * as fs from "fs";
import * as path from "path";
import { Bundler, WritableModules } from "./bundler";
import { ProjectJson, ProjectModule } from "./project";

const PARSER_DTS = `
import { DecodeError, StringFormat } from "@beff/cli";

export type BeffParser<T> = {
  parse: (input: any) => T;
  safeParse: (
    input: any
  ) => { success: true; data: T } | { success: false; errors: DecodeError[] };
};
type Parsers<T> = {
  [K in keyof T]: BeffParser<T[K]>;
};

export type TagOfFormat<T extends StringFormat<string>> =
  T extends StringFormat<infer Tag> ? Tag : never;

declare const _exports: {
  registerStringFormat: <T extends StringFormat<string>>(
    name: TagOfFormat<T>,
    isValid: (it: string) => boolean
  ) => void;
  buildParsers: <T>() => Parsers<T>;
};
export default _exports;
`;
const ROUTER_DTS = `
import { HandlerMetaServer, OpenAPIDocument } from "@beff/cli";
declare const _exports: { meta: HandlerMetaServer[], schema: OpenAPIDocument };
export default _exports;
`;
const CLIENT_DTS = `
import { HandlerMetaClient } from "@beff/cli";
declare const _exports: { meta: HandlerMetaClient[] };
export default _exports;
`;

const buildParsers = `
class BffParseError {
  constructor(errors) {
    this.errors = errors;
  }
}
function buildParsers() {
  let decoders ={};
  Object.keys(buildParsersInput).forEach(k => {
    let v = buildParsersInput[k];
    const safeParse = (input) => {
      const validation_result = v(input);
      if (validation_result.length === 0) {
        return { success: true, data: input };
      }
      return { success: false, errors: validation_result };
    }
    const parse = (input) => {
      const safe = safeParse(input);
      if (safe.success) {
        return safe.data;
      }
      throw new BffParseError(safe.errors)
    };
    decoders[k] = {
      parse, safeParse
    };
  });
  return decoders;
}
`;

const customFormatsCode = `
const stringPredicates = {}
function registerStringFormat(name, predicate) {
  stringPredicates[name] = predicate;
}
function isCodecInvalid(key, value) {
  if (key === 'Codec::ISO8061') {
    return isNaN(Date.parse(value));
  }
  throw new Error("unknown codec: " + key);
}
function isCustomFormatInvalid(key, value) {
  const predicate = stringPredicates[key];
  if (predicate == null) {
    throw new Error("unknown string format: " + key);
  }
  return !predicate(value);
}
`;
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

const exportCode = (mod: ProjectModule) =>
  mod === "esm" ? "export default" : "exports.default =";

const finalizeValidatorsCode = (
  wasmCode: WritableModules,
  mod: ProjectModule
) => {
  const exportedItems = [
    "validators",
    "isCustomFormatInvalid",
    "isCodecInvalid",
    "registerStringFormat",
    "add_path_to_errors",
  ].join(", ");
  const exports = [exportCode(mod), `{ ${exportedItems} };`].join(" ");
  return [
    esmTag(mod),
    `
function add_path_to_errors(errors, path) {
  return errors.map((e) => ({ ...e, path: [...path, ...e.path] }));
}
    `,
    customFormatsCode,
    wasmCode.js_validators,
    exports,
  ].join("\n");
};

const importValidators = (mod: ProjectModule) => {
  const i = `validators, add_path_to_errors, registerStringFormat, isCustomFormatInvalid, isCodecInvalid`;
  return mod === "esm"
    ? `import vals from "./validators.js"; const { ${i} } = vals;`
    : `const { ${i} } = require('./validators.js').default;`;
};
const finalizeRouterFile = (wasmCode: WritableModules, mod: ProjectModule) => {
  const schema = ["const schema = ", wasmCode.json_schema, ";"].join(" ");
  const exportedItems = ["meta", "schema"].join(", ");
  const exports = [exportCode(mod), `{ ${exportedItems} };`].join(" ");
  return [
    esmTag(mod),
    importValidators(mod),
    wasmCode.js_server_meta,
    schema,
    exports,
  ].join("\n");
};
const finalizeClientFile = (wasmCode: WritableModules, mod: ProjectModule) => {
  const exportedItems = ["meta"].join(", ");
  const exports = [exportCode(mod), `{ ${exportedItems} };`].join(" ");
  return [esmTag(mod), wasmCode.js_client_meta, exports].join("\n");
};

const finalizeParserFile = (wasmCode: WritableModules, mod: ProjectModule) => {
  const exportedItems = ["buildParsers", "registerStringFormat"].join(", ");
  const exports = [exportCode(mod), `{ ${exportedItems} };`].join(" ");
  return [
    esmTag(mod),
    importValidators(mod),
    wasmCode.js_built_parsers,
    buildParsers,
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
    console.log(`JS: Router entry point ${routerEntryPoint}`);
    console.log(`JS: Parser entry point ${parserEntryPoint}`);
  }
  const outResult = bundler.bundle(routerEntryPoint, parserEntryPoint);
  if (outResult == null) {
    return "failed";
  }
  const outputDir = path.join(path.dirname(projectPath), projectJson.outputDir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  fs.writeFileSync(
    path.join(outputDir, "validators.js"),
    finalizeValidatorsCode(outResult, mod)
  );

  if (projectJson.router) {
    fs.writeFileSync(
      path.join(outputDir, "router.js"),
      finalizeRouterFile(outResult, mod)
    );
    fs.writeFileSync(
      path.join(outputDir, "router.d.ts"),
      [ROUTER_DTS].join("\n")
    );
    fs.writeFileSync(
      path.join(outputDir, "openapi.json"),
      outResult.json_schema ?? ""
    );

    fs.writeFileSync(
      path.join(outputDir, "client.js"),
      finalizeClientFile(outResult, mod)
    );
    fs.writeFileSync(
      path.join(outputDir, "client.d.ts"),
      [CLIENT_DTS].join("\n")
    );
  }

  if (projectJson.parser) {
    fs.writeFileSync(
      path.join(outputDir, "parser.js"),
      finalizeParserFile(outResult, mod)
    );
    fs.writeFileSync(
      path.join(outputDir, "parser.d.ts"),
      [PARSER_DTS].join("\n")
    );
  }
  return "ok";
};
