import { ZodType } from "zod";

export type Header<T> = T;
export type StringFormat<Tag extends string> = string & { __customType: Tag };

export type RegularDecodeError = {
  message: string;
  path: string[];
  received: unknown;
};
export type UnionDecodeError = {
  path: string[];
  received: unknown;
  isUnionError: true;
  errors: DecodeError[];
};
export type DecodeError = RegularDecodeError | UnionDecodeError;

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
