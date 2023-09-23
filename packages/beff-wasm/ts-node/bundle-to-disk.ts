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

const decoders = `

function pushPath(ctx, path) {
  if (ctx.paths == null) {
    ctx.paths = [];
  }
  ctx.paths.push(path);
}
function popPath(ctx) {
  if (ctx.paths == null) {
    throw new Error("popPath: no paths");
  }
  return ctx.paths.pop();
}
function buildError(received, ctx, message, ) {
  if (ctx.errors == null) {
    ctx.errors = [];
  }
  ctx.errors.push({
    message,
    path: [...(ctx.paths??[])],
    received
  })
}

function decodeObject(ctx, input, required, data) {
  if (!required && input == null) {
    return input;
  }
  if (
    typeof input === 'object' &&
    !Array.isArray(input) &&
    input !== null
  ) {
    const acc = {};
    for (const [k, v] of Object.entries(data)) {
      pushPath(ctx, k);
      acc[k] = v(ctx, input[k]);
      popPath(ctx);
    }
    return acc;
  }
  return buildError(input, ctx,  "expected object")
}
function decodeArray(ctx, input, required, data) {
  if (!required && input == null) {
    return input;
  }
  if (Array.isArray(input)) {
    const acc = [];
    for(let i = 0; i < input.length; i++) {
      const v = input[i];
      pushPath(ctx, '['+i+']');
      acc.push(data(ctx, v));
      popPath(ctx);
    }
    return acc;
  }
  return buildError(input, ctx,  "expected array")
}
function decodeString(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }

  if (typeof input === 'string') {
    return input;
  }

  return buildError(input, ctx,  "expected string")
}
const isNumeric = (num) =>
  (typeof num === "number" || (typeof num === "string" && num.trim() !== "")) &&
  !isNaN(num );

function decodeNumber(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === "number") {
    return input;
  }
  if (isNumeric(input)) {
    return Number(input);
  }

  return buildError(input, ctx,  "expected number")
}

function encodeCodec(codec, value) {
  switch (codec) {
    case "Codec::ISO8061": {
      return value.toISOString();
    }
    case "Codec::BigInt": {
      return value.toString();
    }
  }
  throw new Error("encode - codec not found: "+codec);
}

function decodeCodec(ctx, input, required, codec) {
  if (!required && input == null) {
    return input;
  }
  switch (codec) {
    case "Codec::ISO8061": {
      const d = new Date(input);
      if (isNaN(d.getTime())) {
        return buildError(input, ctx,  "expected ISO8061 date")
      }
      return d;
    }
    case "Codec::BigInt": {
      if (typeof input === "bigint") {
        return input;
      }
      if (typeof input === "number") {
        return BigInt(input);
      }
      if (typeof input === "string") {
        return BigInt(input);
      }
      return buildError(input, ctx,  "expected bigint")
    }
  }
  return buildError(input, ctx,  "codec " + codec + " not implemented")
}

function decodeStringWithFormat(ctx, input, required, format) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === 'string') {
    if (isCustomFormatValid(format, input)) {
      return input;
    }
    return buildError(input, ctx,  "expected "+format)
  }
  return buildError(input, ctx,  "expected string")
}
function decodeAnyOf(ctx, input, required, vs) {
  if (!required && input == null) {
    return input;
  }
  for (const v of vs) {
    const validatorCtx = {};
    const newValue = v(validatorCtx, input);
    if (validatorCtx.errors == null) {
      return newValue;
    }
  }
  return buildError(input, ctx,  "expected one of")
}
function decodeAllOf(ctx, input, required, vs) {
  if (!required && input == null) {
    return input;
  }
  let acc = {};
  let foundOneObject = false;
  let allObjects = true;
  for (const v of vs) {
    const newValue = v(ctx, input);
    const isObj = typeof newValue === "object";
    allObjects = allObjects && isObj;
    if (isObj) {
      foundOneObject = true;
      acc = { ...acc, ...newValue };
    }
  }
  if (foundOneObject && allObjects) {
    return acc;
  }
  return input;
}
function decodeTuple(ctx, input, required, vs) {
  if (!required && input == null) {
    return input;
  }
  throw new Error("decodeTuple not implemented");
}
function decodeBoolean(ctx, input, required, ) {
  if (!required && input == null) {
    return input;
  }
  if (typeof input === "boolean") {
    return input;
  }
  if (input === "true" || input === "false") {
    return (input === "true");
  }
  if (input === "1" || input === "0") {
    return (input === "1");
  }
  return buildError(input, ctx,  "expected boolean")
}
function decodeAny(ctx, input, required) {
  return input;
}
function decodeNull(ctx, input, required) {
  if (!required && input == null) {
    return input;
  }
  if (input === null) {
    return input;
  }
  return buildError(input, ctx,  "expected null")
}
function decodeConst(ctx, input, required, constValue) {
  if (!required && input == null) {
    return input;
  }
  if (input == constValue) {
    return constValue;
  }
  return buildError(input, ctx,  "expected "+JSON.stringify(constValue))
}

function encodeAllOf(cbs, value) {
  if (typeof value === "object") {
    let acc = {};
    for (const cb of cbs) {
      const newValue = cb(value);
      acc = { ...acc, ...newValue };
    }
    return acc;
  }
  return value;
}

function encodeAnyOf(cbs, value) {
  for (const cb of cbs) {
    return cb(value);
  }
  return value
}
`;
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
];

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
      const validatorCtx = {
      };
      const new_value = v(validatorCtx, input);
      const validation_result = validatorCtx.errors;
      if (validation_result == null) {
        return { success: true, data: new_value };
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

function isCustomFormatValid(key, value) {
  const predicate = stringPredicates[key];
  if (predicate == null) {
    throw new Error("unknown string format: " + key);
  }
  return predicate(value);
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
    ...decodersExported,
    "validators",
    "encoders",
    "isCustomFormatValid",
    "registerStringFormat",
  ].join(", ");
  const exports = [exportCode(mod), `{ ${exportedItems} };`].join(" ");
  return [
    decoders,
    esmTag(mod),
    customFormatsCode,
    wasmCode.js_validators,
    exports,
  ].join("\n");
};

const importValidators = (mod: ProjectModule) => {
  const i = [
    ...decodersExported,
    "validators",
    "encoders",
    "registerStringFormat",
    "c",
  ].join(", ");
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
