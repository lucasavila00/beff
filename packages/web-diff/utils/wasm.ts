import { init, schema_to_ts_types } from "@/pkg";

let cache: any = null;
export const beffWasm = (): { schema_to_ts_types: typeof schema_to_ts_types } => {
  if (cache) {
    return cache;
  }
  init(true);
  cache = { schema_to_ts_types };
  return cache;
};
