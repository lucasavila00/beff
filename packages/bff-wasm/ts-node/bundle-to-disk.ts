import * as fs from "fs";
import * as path from "path";
import { Bundler, WritableModules } from "./bundler";
import { ProjectJson, ProjectModule } from "./project";

const RUNTIME_DTS = `
import { HandlerMeta, DecodeError,StringFormat} from "bff-types";
export declare const meta: HandlerMeta[];
export declare const schema: any;


type Decoders<T> = {
  [K in keyof T]: {
    parse: (input: any) => T[K];
    safeParse: (
      input: any
    ) =>
      | { success: true; data: T[K] }
      | { success: false; errors: DecodeError[] };
  };
};
export declare const buildParsers: <T>() => Decoders<T>;



export type TagOfFormat<T extends StringFormat<string>> =
  T extends StringFormat<infer Tag> ? Tag : never;
export declare function registerStringFormat<T extends StringFormat<string>>(
  name: TagOfFormat<T>,
  isValid: (it: string) => boolean
): void;

`;

const decodersCode = `
class CoercionFailure {}
function add_path_to_errors(errors, path) {
  return errors.map((e) => ({ ...e, path: [...path, ...e.path] }));
}
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
const stringPredicates = {}
function registerStringFormat(name, predicate) {
  stringPredicates[name] = predicate;
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
const finalizeFile = (wasmCode: WritableModules, mod: ProjectModule) => {
  const exportCode = mod === "esm" ? "export " : "module.exports = ";
  const exportedItems = [
    "meta",
    "schema",
    "buildParsers",
    "registerStringFormat",
  ]
    .filter((it) => it.length > 0)
    .join(", ");
  const exports = [exportCode, `{ ${exportedItems} };`].join(" ");
  const schema = ["const schema = ", wasmCode.json_schema, ";"].join(" ");
  return [
    decodersCode,
    wasmCode.js_server_data,
    buildParsers,
    schema,
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
  const entryPoint = path.join(path.dirname(projectPath), projectJson.router);
  const outResult = bundler.bundle(entryPoint);
  if (outResult == null) {
    process.exit(1);
  }
  const outputDir = path.join(path.dirname(projectPath), projectJson.outputDir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const outputFile = path.join(outputDir, "index.js");
  const finalFile = finalizeFile(outResult, mod);
  fs.writeFileSync(outputFile, finalFile);

  const outputDts = path.join(outputDir, "index.d.ts");
  fs.writeFileSync(outputDts, [RUNTIME_DTS].join("\n"));
  const outputSchemaJson = path.join(outputDir, "openapi.json");
  fs.writeFileSync(outputSchemaJson, outResult.json_schema);
};
