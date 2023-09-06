import { StringFormat } from "@beff/cli";
import parser from "./bff-generated/parser";

export type StartsWithA = StringFormat<"StartsWithA">;
// parser.registerStringFormat<StartsWithA>("StartsWithA", (it) =>
//   it.startsWith("A")
// );
export const { StartsWithA } = parser.buildParsers<{
  StartsWithA: StartsWithA;
}>();
