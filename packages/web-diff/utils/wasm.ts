import { init, schema_to_ts_types, text_diff_schemas } from "@/pkg";

let cache: any = null;
export const beffWasm = (): {
  text_diff_schemas: typeof text_diff_schemas;
  schema_to_ts_types: typeof schema_to_ts_types;
} => {
  if (cache) {
    return cache;
  }
  init(true);
  cache = { schema_to_ts_types, text_diff_schemas };
  return cache;
};
