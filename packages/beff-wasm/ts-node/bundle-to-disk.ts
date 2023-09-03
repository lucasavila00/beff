import * as fs from "fs";
import * as path from "path";
import { Bundler, WritableModules } from "./bundler";
import { ProjectJson, ProjectModule } from "./project";

const PARSER_DTS = `
import { DecodeError,StringFormat} from "@beff/cli";

export type BeffParser<T> = {
  parse: (input: any) => T;
  safeParse: (
    input: any
  ) => { success: true; data: T } | { success: false; errors: DecodeError[] };
};
type Parsers<T> = {
  [K in keyof T]: BeffParser<T[K]>;
};
export declare const buildParsers: <T>() => Parsers<T>;

export type TagOfFormat<T extends StringFormat<string>> =
  T extends StringFormat<infer Tag> ? Tag : never;
export declare function registerStringFormat<T extends StringFormat<string>>(
  name: TagOfFormat<T>,
  isValid: (it: string) => boolean
): void;
`;
const ROUTER_DTS = `
import { HandlerMetaServer} from "@beff/cli";
export declare const meta: HandlerMetaServer[];
export declare const schema: any;
`;
const CLIENT_DTS = `
import { HandlerMetaClient} from "@beff/cli";
export declare const meta: HandlerMetaClient[];

`;
const coercerCode = `
class CoercionFailure {}
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
function coerce(coercer, value) {
  return coercer(value);
}
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

// a hint to UIs to mask the input
registerStringFormat("password", () => true);

function isCustomFormatInvalid(key, value) {
  const predicate = stringPredicates[key];
  if (predicate == null) {
    throw new Error("unknown string format: " + key);
  }
  return !predicate(value);
}
`;

const finalizeValidatorsCode = (
  wasmCode: WritableModules,
  mod: ProjectModule
) => {
  const exportCode = mod === "esm" ? "export " : "module.exports = ";
  const exportedItems = [
    "validators",
    "isCustomFormatInvalid",
    "registerStringFormat",
    "add_path_to_errors",
  ].join(", ");
  const exports = [exportCode, `{ ${exportedItems} };`].join(" ");
  return [
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
  const i = `validators, add_path_to_errors, registerStringFormat, isCustomFormatInvalid`;
  return mod === "esm"
    ? `import { ${i} } from "./validators.js";`
    : `const { ${i} } = require('./validators.js');`;
};
const finalizeRouterFile = (wasmCode: WritableModules, mod: ProjectModule) => {
  const exportCode = mod === "esm" ? "export" : "module.exports =";
  const schema = ["const schema = ", wasmCode.json_schema, ";"].join(" ");
  const exportedItems = ["meta", "schema"].join(", ");
  const exports = [exportCode, `{ ${exportedItems} };`].join(" ");
  return [
    importValidators(mod),
    coercerCode,
    wasmCode.js_server_meta,
    schema,
    exports,
  ].join("\n");
};
const finalizeClientFile = (wasmCode: WritableModules, mod: ProjectModule) => {
  const exportCode = mod === "esm" ? "export" : "module.exports =";
  const exportedItems = ["meta"].join(", ");
  const exports = [exportCode, `{ ${exportedItems} };`].join(" ");
  return [wasmCode.js_client_meta, exports].join("\n");
};

const finalizeParserFile = (wasmCode: WritableModules, mod: ProjectModule) => {
  const exportCode = mod === "esm" ? "export " : "module.exports = ";
  const exportedItems = ["buildParsers", "registerStringFormat"].join(", ");
  const exports = [exportCode, `{ ${exportedItems} };`].join(" ");
  return [
    importValidators(mod),
    wasmCode.js_built_parsers,
    buildParsers,
    exports,
  ].join("\n");
};

export const execProject = (
  projectPath: string,
  projectJson: ProjectJson,
  verbose: boolean
) => {
  const mod = projectJson.module ?? "esm";
  const bundler = new Bundler(verbose);
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
    process.exit(1);
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
};
