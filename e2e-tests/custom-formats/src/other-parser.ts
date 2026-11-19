import parse from "./generated/other/parser";
import { StringFormat } from "@beff/client";

export type ValidCurrency = StringFormat<"ValidCurrency">;

export const OtherCodecs = parse.buildParsers<{
  ValidCurrency: ValidCurrency;
}>({
  stringFormats: {
    ValidCurrency: (input: string) => input === "BRL",
  },
});
