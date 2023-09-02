import * as fs from "fs";
import * as path from "path";
import { Bundler, WritableModules } from "./bundler";
import { ProjectJson, ProjectModule } from "./project";

const RUNTIME_DTS = `
// This was extracted from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/json-schema/index.d.ts
//==================================================================================================
// JSON Schema Draft 07
//==================================================================================================
// https://tools.ietf.org/html/draft-handrews-json-schema-validation-01
//--------------------------------------------------------------------------------------------------

/**
 * Primitive type
 * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-6.1.1
 */
type JSONSchema7TypeName =
    | 'string' //
    | 'number'
    | 'integer'
    | 'boolean'
    | 'object'
    | 'array'
    | 'null';

/**
 * Primitive type
 * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-6.1.1
 */
type JSONSchema7Type =
    | string //
    | number
    | boolean
    | JSONSchema7Object
    | JSONSchema7Array
    | null;

// Workaround for infinite type recursion
interface JSONSchema7Object {
    [key: string]: JSONSchema7Type;
}

// Workaround for infinite type recursion
// https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
interface JSONSchema7Array extends Array<JSONSchema7Type> {}

/**
 * Meta schema
 *
 * Recommended values:
 * - 'http://json-schema.org/schema#'
 * - 'http://json-schema.org/hyper-schema#'
 * - 'http://json-schema.org/draft-07/schema#'
 * - 'http://json-schema.org/draft-07/hyper-schema#'
 *
 * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-5
 */
type JSONSchema7Version = string;

/**
 * JSON Schema v7
 * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01
 */
type JSONSchema7Definition = JSONSchema7 | boolean;
interface JSONSchema7 {
    $id?: string | undefined;
    $ref?: string | undefined;
    $schema?: JSONSchema7Version | undefined;
    $comment?: string | undefined;

    /**
     * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-00#section-8.2.4
     * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation-00#appendix-A
     */
    $defs?: {
              [key: string]: JSONSchema7Definition;
    } | undefined;

    /**
     * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-6.1
     */
    type?: JSONSchema7TypeName | JSONSchema7TypeName[] | undefined;
    enum?: JSONSchema7Type[] | undefined;
    const?: JSONSchema7Type | undefined;

    /**
     * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-6.2
     */
    multipleOf?: number | undefined;
    maximum?: number | undefined;
    exclusiveMaximum?: number | undefined;
    minimum?: number | undefined;
    exclusiveMinimum?: number | undefined;

    /**
     * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-6.3
     */
    maxLength?: number | undefined;
    minLength?: number | undefined;
    pattern?: string | undefined;

    /**
     * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-6.4
     */
    items?: JSONSchema7Definition | JSONSchema7Definition[] | undefined;
    additionalItems?: JSONSchema7Definition | undefined;
    maxItems?: number | undefined;
    minItems?: number | undefined;
    uniqueItems?: boolean | undefined;
    contains?: JSONSchema7Definition | undefined;

    /**
     * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-6.5
     */
    maxProperties?: number | undefined;
    minProperties?: number | undefined;
    required?: string[] | undefined;
    properties?: {
        [key: string]: JSONSchema7Definition;
    } | undefined;
    patternProperties?: {
        [key: string]: JSONSchema7Definition;
    } | undefined;
    additionalProperties?: JSONSchema7Definition | undefined;
    dependencies?: {
        [key: string]: JSONSchema7Definition | string[];
    } | undefined;
    propertyNames?: JSONSchema7Definition | undefined;

    /**
     * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-6.6
     */
    if?: JSONSchema7Definition | undefined;
    then?: JSONSchema7Definition | undefined;
    else?: JSONSchema7Definition | undefined;

    /**
     * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-6.7
     */
    allOf?: JSONSchema7Definition[] | undefined;
    anyOf?: JSONSchema7Definition[] | undefined;
    oneOf?: JSONSchema7Definition[] | undefined;
    not?: JSONSchema7Definition | undefined;

    /**
     * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-7
     */
    format?: string | undefined;

    /**
     * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-8
     */
    contentMediaType?: string | undefined;
    contentEncoding?: string | undefined;

    /**
     * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-9
     */
    definitions?: {
        [key: string]: JSONSchema7Definition;
    } | undefined;

    /**
     * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-10
     */
    title?: string | undefined;
    description?: string | undefined;
    default?: JSONSchema7Type | undefined;
    readOnly?: boolean | undefined;
    writeOnly?: boolean | undefined;
    examples?: JSONSchema7Type | undefined;
}

export type MetaParam = {
  type: "path" | "query" | "cookie" | "header" | "body" | "context";
  name: string;
  required: boolean;
  validator: any;
  coercer: any;
};
export type HandlerMeta = {
  method_kind: "get" | "post" | "put" | "delete" | "patch" | "options" | "use";
  params: MetaParam[];
  pattern: string;
  return_validator: any;
};

export type DecodeErrorKind = ["NotTypeof", string];
export type DecodeError = {
  kind: DecodeErrorKind;
  path: string[];
};

export declare const meta: HandlerMeta[];
export declare const schema: JSONSchema7;
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
`;
const finalizeFile = (wasmCode: WritableModules, mod: ProjectModule) => {
  const exportCode = mod === "esm" ? "export " : "module.exports = ";
  const exports = [exportCode, "{ meta, schema };"].join(" ");
  const schema = ["const schema = ", wasmCode.json_schema, ";"].join(" ");
  return [decodersCode, wasmCode.js_server_data, schema, exports].join("\n");
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
  fs.writeFileSync(outputDts, RUNTIME_DTS);
  const outputSchemaJson = path.join(outputDir, "schema.json");
  fs.writeFileSync(outputSchemaJson, outResult.json_schema);
};
