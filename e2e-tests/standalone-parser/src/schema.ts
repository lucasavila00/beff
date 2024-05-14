import s from "./generated/schema";
import { T3 } from "./parser";

export const Schemas = s.buildSchemas<{
  T3: T3;
}>();
