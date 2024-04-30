import { DecodeError, StringFormat } from "@beff/cli";
//@ts-ignore
import { ZodType } from "zod";

export type BeffParser<T> = {
  parse: (input: any) => T;
  safeParse: (input: any) => { success: true; data: T } | { success: false; errors: DecodeError[] };
  zod: () => ZodType<T>;
};
type Parsers<T> = {
  [K in keyof T]: BeffParser<T[K]>;
};

export type TagOfFormat<T extends StringFormat<string>> = T extends StringFormat<infer Tag> ? Tag : never;

export type BuildParserFunction = <T>(args?: {
  customFormats?: { [key: string]: (input: string) => boolean };
}) => Parsers<T>;

declare const _exports: {
  buildParsers: BuildParserFunction
};

export default _exports;
