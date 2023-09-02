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

export type ErrorVariant<T> = {
  error_kind: T;
  path: string[];
};
export type DecodeError =
  | ErrorVariant<"NotAnObject">
  | ErrorVariant<"NotAnArray">
  | ErrorVariant<"InvalidUnion">
  | (ErrorVariant<"NotTypeof"> & {
      expected_type: string;
    })
  | (ErrorVariant<"NotEq"> & {
      expected_value: unknown;
    });
export type OpenApiServer = any;
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
  | "string" //
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "null";

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
export interface JSONSchema7 {
  $id?: string | undefined;
  $ref?: string | undefined;
  $schema?: JSONSchema7Version | undefined;
  $comment?: string | undefined;

  /**
   * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-00#section-8.2.4
   * @see https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation-00#appendix-A
   */
  $defs?:
    | {
        [key: string]: JSONSchema7Definition;
      }
    | undefined;

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
  properties?:
    | {
        [key: string]: JSONSchema7Definition;
      }
    | undefined;
  patternProperties?:
    | {
        [key: string]: JSONSchema7Definition;
      }
    | undefined;
  additionalProperties?: JSONSchema7Definition | undefined;
  dependencies?:
    | {
        [key: string]: JSONSchema7Definition | string[];
      }
    | undefined;
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
  definitions?:
    | {
        [key: string]: JSONSchema7Definition;
      }
    | undefined;

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
