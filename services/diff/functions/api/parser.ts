import { StringFormat } from "@beff/cli";
import parse from "./generated/parser";

export type ISO8061 = StringFormat<"ISO8061">;

const ISO_8061_REGEX =
  /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$/;
parse.registerStringFormat("ISO8061", (it: string) => ISO_8061_REGEX.test(it));

export const { ISO8061 } = parse.buildParsers<{ ISO8061: ISO8061 }>();
