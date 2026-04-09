import { JSONSchema7, JSONSchema7Definition } from "./json-schema.js";

type NormalizeOptions = {
  refPathTemplate: string;
};

export const normalizeOpenApiSchema = (
  schema: JSONSchema7Definition,
  _definitions: Record<string, JSONSchema7Definition>,
  _options: NormalizeOptions,
): JSONSchema7Definition => {
  return normalizeDefinition(schema);
};

const normalizeDefinition = (definition: JSONSchema7Definition): JSONSchema7Definition => {
  if (typeof definition === "boolean") {
    return definition;
  }

  const schema: JSONSchema7 = { ...definition };

  if (schema.properties != null) {
    const properties: Record<string, JSONSchema7Definition> = {};
    const optionalized = new Set<string>();

    for (const [key, value] of Object.entries(schema.properties)) {
      const normalized = normalizeDefinition(value);
      const rewrite = stripNullUnion(normalized);
      if (rewrite != null) {
        properties[key] = rewrite.schema;
        optionalized.add(key);
      } else {
        properties[key] = normalized;
      }
    }

    schema.properties = properties;

    if (schema.required != null) {
      schema.required = schema.required.filter((key) => !optionalized.has(key));
    }
  }

  if (schema.items != null) {
    schema.items = Array.isArray(schema.items)
      ? schema.items.map((item) => normalizeDefinition(item))
      : normalizeDefinition(schema.items);
  }

  if (schema.additionalItems != null) {
    schema.additionalItems = normalizeDefinition(schema.additionalItems);
  }

  if (schema.additionalProperties != null) {
    schema.additionalProperties = normalizeDefinition(schema.additionalProperties);
  }

  if (schema.propertyNames != null) {
    schema.propertyNames = normalizeDefinition(schema.propertyNames);
  }

  if (schema.contains != null) {
    schema.contains = normalizeDefinition(schema.contains);
  }

  if (schema.not != null) {
    schema.not = normalizeDefinition(schema.not);
  }

  if (schema.if != null) {
    schema.if = normalizeDefinition(schema.if);
  }

  if (schema.then != null) {
    schema.then = normalizeDefinition(schema.then);
  }

  if (schema.else != null) {
    schema.else = normalizeDefinition(schema.else);
  }

  if (schema.anyOf != null) {
    schema.anyOf = schema.anyOf.map((item) => normalizeDefinition(item));
  }

  if (schema.oneOf != null) {
    schema.oneOf = schema.oneOf.map((item) => normalizeDefinition(item));
  }

  if (schema.allOf != null) {
    schema.allOf = schema.allOf.map((item) => normalizeDefinition(item));
  }

  if (schema.$defs != null) {
    schema.$defs = normalizeRecord(schema.$defs);
  }

  if (schema.definitions != null) {
    schema.definitions = normalizeRecord(schema.definitions);
  }

  if (schema.patternProperties != null) {
    schema.patternProperties = normalizeRecord(schema.patternProperties);
  }

  if (schema.dependencies != null) {
    const dependencies: Record<string, JSONSchema7Definition | string[]> = {};
    for (const [key, value] of Object.entries(schema.dependencies)) {
      dependencies[key] = Array.isArray(value) ? value : normalizeDefinition(value);
    }
    schema.dependencies = dependencies;
  }

  return schema;
};

const normalizeRecord = (
  record: Record<string, JSONSchema7Definition>,
): Record<string, JSONSchema7Definition> => {
  const normalized: Record<string, JSONSchema7Definition> = {};
  for (const [key, value] of Object.entries(record)) {
    normalized[key] = normalizeDefinition(value);
  }
  return normalized;
};

const stripNullUnion = (
  definition: JSONSchema7Definition,
): { schema: JSONSchema7Definition } | null => {
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
    return { schema: nonNull[0] };
  }

  return {
    schema: {
      ...definition,
      [variantsKey]: nonNull,
    },
  };
};

const isNullDefinition = (definition: JSONSchema7Definition): boolean => {
  return typeof definition !== "boolean" && definition.type === "null";
};
