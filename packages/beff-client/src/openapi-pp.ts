import { JSONSchema7, JSONSchema7Definition } from "./json-schema.js";

type NormalizeOptions = {
  refPathTemplate: string;
};

type ObjectSchemaTransform = (schema: JSONSchema7) => JSONSchema7;

type MergeableObjectSchema = JSONSchema7 & {
  type?: "object";
};

/**
 * Applies all object-schema transforms in order. The pipeline makes it explicit
 * which post-processing operations run at object boundaries and in which order.
 */
const runObjectSchemaPipeline = (schema: JSONSchema7): JSONSchema7 => {
  const objectSchemaPipeline: ObjectSchemaTransform[] = [
    flattenObjectAllOfIntersections,
    optionalizeNullUnionProperties,
  ];

  return objectSchemaPipeline.reduce((acc, transform) => transform(acc), schema);
};
/**
 * Normalizes generated JSON Schema into a shape that is easier for OpenAPI tooling
 * to consume. The implementation is intentionally split in two phases:
 * 1. recursively normalize nested child schemas
 * 2. run object-level transforms on the current schema node
 */
export const normalizeOpenApiSchema = (
  schema: JSONSchema7Definition,
  _definitions: Record<string, JSONSchema7Definition>,
  _options: NormalizeOptions,
): JSONSchema7Definition => {
  return walkDefinition(schema);
};

/**
 * Recursively walks a schema definition and normalizes every nested schema node.
 * Booleans are JSON Schema leaf values, so they pass through untouched.
 */
const walkDefinition = (definition: JSONSchema7Definition): JSONSchema7Definition => {
  if (typeof definition === "boolean") {
    return definition;
  }

  const schema: JSONSchema7 = { ...definition };

  if (schema.properties != null) {
    const properties: Record<string, JSONSchema7Definition> = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      properties[key] = walkDefinition(value);
    }
    schema.properties = properties;
  }

  if (schema.items != null) {
    schema.items = Array.isArray(schema.items)
      ? schema.items.map((item) => walkDefinition(item))
      : walkDefinition(schema.items);
  }

  if (schema.additionalItems != null) {
    schema.additionalItems = walkDefinition(schema.additionalItems);
  }

  if (schema.additionalProperties != null) {
    schema.additionalProperties = walkDefinition(schema.additionalProperties);
  }

  if (schema.propertyNames != null) {
    schema.propertyNames = walkDefinition(schema.propertyNames);
  }

  if (schema.contains != null) {
    schema.contains = walkDefinition(schema.contains);
  }

  if (schema.not != null) {
    schema.not = walkDefinition(schema.not);
  }

  if (schema.if != null) {
    schema.if = walkDefinition(schema.if);
  }

  if (schema.then != null) {
    schema.then = walkDefinition(schema.then);
  }

  if (schema.else != null) {
    schema.else = walkDefinition(schema.else);
  }

  if (schema.anyOf != null) {
    schema.anyOf = schema.anyOf.map((item) => walkDefinition(item));
  }

  if (schema.oneOf != null) {
    schema.oneOf = schema.oneOf.map((item) => walkDefinition(item));
  }

  if (schema.allOf != null) {
    schema.allOf = schema.allOf.map((item) => walkDefinition(item));
  }

  if (schema.$defs != null) {
    schema.$defs = walkRecord(schema.$defs);
  }

  if (schema.definitions != null) {
    schema.definitions = walkRecord(schema.definitions);
  }

  if (schema.patternProperties != null) {
    schema.patternProperties = walkRecord(schema.patternProperties);
  }

  if (schema.dependencies != null) {
    const dependencies: Record<string, JSONSchema7Definition | string[]> = {};
    for (const [key, value] of Object.entries(schema.dependencies)) {
      dependencies[key] = Array.isArray(value) ? value : walkDefinition(value);
    }
    schema.dependencies = dependencies;
  }

  return runObjectSchemaPipeline(schema);
};

/**
 * Recursively normalizes every value in a schema-definition map such as
 * `properties`, `$defs`, `definitions`, or `patternProperties`.
 */
const walkRecord = (
  record: Record<string, JSONSchema7Definition>,
): Record<string, JSONSchema7Definition> => {
  const normalized: Record<string, JSONSchema7Definition> = {};
  for (const [key, value] of Object.entries(record)) {
    normalized[key] = walkDefinition(value);
  }
  return normalized;
};

/**
 * Flattens the object intersections produced for object types with index signatures.
 *
 * The code generator currently emits these as `allOf` between:
 * - a fixed-properties object
 * - an index-signature object
 *
 * OpenAPI generators tend to handle the flattened single-object form better.
 */
const flattenObjectAllOfIntersections = (schema: JSONSchema7): JSONSchema7 => {
  if (schema.allOf == null) {
    return schema;
  }

  const branches = schema.allOf.map(asMergeableObjectSchema);
  if (branches.some((branch) => branch == null)) {
    return schema;
  }

  const merged: MergeableObjectSchema = {
    ...schema,
    type: "object",
  };

  delete merged.allOf;

  const properties: Record<string, JSONSchema7Definition> = {};
  const required = new Set<string>();
  let additionalProperties: JSONSchema7Definition | undefined = undefined;
  let propertyNames: JSONSchema7Definition | undefined = undefined;

  for (const branch of branches) {
    for (const [key, value] of Object.entries(branch.properties ?? {})) {
      if (key in properties && JSON.stringify(properties[key]) !== JSON.stringify(value)) {
        return schema;
      }
      properties[key] = value;
    }

    for (const key of branch.required ?? []) {
      required.add(key);
    }

    if (branch.additionalProperties !== undefined) {
      if (
        additionalProperties !== undefined &&
        JSON.stringify(additionalProperties) !== JSON.stringify(branch.additionalProperties)
      ) {
        return schema;
      }
      additionalProperties = normalizeUnknownSchema(branch.additionalProperties);
    }

    if (branch.propertyNames !== undefined) {
      if (propertyNames !== undefined && JSON.stringify(propertyNames) !== JSON.stringify(branch.propertyNames)) {
        return schema;
      }
      propertyNames = branch.propertyNames;
    }
  }

  if (Object.keys(properties).length > 0) {
    merged.properties = properties;
  } else {
    delete merged.properties;
  }

  if (required.size > 0) {
    merged.required = [...required];
  } else {
    delete merged.required;
  }

  if (additionalProperties !== undefined) {
    merged.additionalProperties = additionalProperties;
  }

  if (propertyNames !== undefined && !isRedundantStringPropertyNames(propertyNames)) {
    merged.propertyNames = propertyNames;
  } else {
    delete merged.propertyNames;
  }

  return merged;
};

/**
 * Rewrites object properties shaped as `T | null` into optional properties.
 *
 * This only runs at object-property boundaries. Standalone unions, array items,
 * and other non-property positions keep their original nullable-union semantics.
 */
const optionalizeNullUnionProperties = (schema: JSONSchema7): JSONSchema7 => {
  if (schema.properties == null) {
    return schema;
  }

  const properties: Record<string, JSONSchema7Definition> = {};
  const optionalized = new Set<string>();

  for (const [key, value] of Object.entries(schema.properties)) {
    const rewrite = removeNullUnionBranch(value);
    if (rewrite != null) {
      properties[key] = rewrite;
      optionalized.add(key);
    } else {
      properties[key] = value;
    }
  }

  const required = schema.required?.filter((key) => !optionalized.has(key));
  return {
    ...schema,
    properties,
    required,
  };
};

/**
 * If a property schema is a top-level `anyOf`/`oneOf` that includes a `null`
 * branch plus at least one non-null branch, remove the `null` branch.
 *
 * Returning `null` means "leave this property schema unchanged".
 */
const removeNullUnionBranch = (
  definition: JSONSchema7Definition,
): JSONSchema7Definition | null => {
  if (typeof definition === "boolean") {
    return null;
  }

  const variantsKey = definition.anyOf != null ? "anyOf" : definition.oneOf != null ? "oneOf" : null;
  if (variantsKey == null) {
    return null;
  }

  const variants = definition[variantsKey];
  if (variants == null) {
    return null;
  }

  const nonNull = variants.filter((variant) => !isNullDefinition(variant));
  if (nonNull.length === variants.length || nonNull.length === 0) {
    return null;
  }

  if (nonNull.length === 1) {
    return nonNull[0];
  }

  return {
    ...definition,
    [variantsKey]: nonNull,
  };
};

/**
 * Detects a schema branch that represents JSON `null`.
 */
const isNullDefinition = (definition: JSONSchema7Definition): boolean => {
  return typeof definition !== "boolean" && definition.type === "null";
};

/**
 * Accepts an object-schema branch when it is safe to merge into a flattened
 * single object schema.
 */
const asMergeableObjectSchema = (definition: JSONSchema7Definition): MergeableObjectSchema | null => {
  if (typeof definition === "boolean") {
    return null;
  }

  if (definition.type !== undefined && definition.type !== "object") {
    return null;
  }

  return definition;
};

/**
 * Rewrites the empty schema `{}` to `true`, which is a clearer OpenAPI/JSON Schema
 * representation for "any value" in `additionalProperties`.
 */
const normalizeUnknownSchema = (definition: JSONSchema7Definition): JSONSchema7Definition => {
  if (typeof definition !== "boolean" && Object.keys(definition).length === 0) {
    return true;
  }

  return definition;
};

/**
 * Drops the generated `propertyNames: { type: "string" }` constraint because JSON
 * object keys are already strings and many OpenAPI tools ignore or mishandle it.
 */
const isRedundantStringPropertyNames = (definition: JSONSchema7Definition): boolean => {
  return typeof definition !== "boolean" && definition.type === "string" && Object.keys(definition).length === 1;
};
