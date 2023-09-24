import { init, schema_to_ts_types, text_diff_schemas, compare_schemas_for_errors } from "@/pkg";

let cache: any = null;
const beffWasm = (): {
  text_diff_schemas: typeof text_diff_schemas;
  schema_to_ts_types: typeof schema_to_ts_types;
  compare_schemas_for_errors: typeof compare_schemas_for_errors;
} => {
  if (cache) {
    return cache;
  }
  init(true);
  cache = { schema_to_ts_types, text_diff_schemas, compare_schemas_for_errors };
  return cache;
};

export const schemaToTsTypes = (schema: string): string => beffWasm().schema_to_ts_types(schema);
export const textDiffSchemas = (from: string, to: string): string => beffWasm().text_diff_schemas(from, to);

export type SchemaErrorTag = "Heading" | "Text" | "TsTypes" | "Json";
export type SchemaError = {
  _tag: SchemaErrorTag;
  data: string;
};

export const compareSchemasForErrors = (from: string, to: string): SchemaError[] =>
  beffWasm().compare_schemas_for_errors(from, to);
