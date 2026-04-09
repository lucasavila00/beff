import { JSONSchema7Definition } from "./json-schema.js";

/**
 * If a property schema is a top-level `anyOf`/`oneOf` that includes a `null`
 * branch plus at least one non-null branch, remove the `null` branch.
 *
 * Returning `null` means "leave this property schema unchanged".
 */
export const removeNullUnionBranch = (definition: JSONSchema7Definition): JSONSchema7Definition | null => {
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
