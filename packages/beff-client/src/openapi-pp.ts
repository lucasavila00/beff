import {  JSONSchema7Definition } from "./json-schema.js";

type NormalizeOptions = {
  refPathTemplate: string;
};

export const normalizeOpenApiSchema = (
  schema: JSONSchema7Definition,
  _definitions: Record<string, JSONSchema7Definition>,
  _options: NormalizeOptions,
): JSONSchema7Definition => {
  return schema
};

