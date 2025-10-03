import type { ZodType } from "zod";
import { JSONSchema7 } from "./json-schema";

export type StringFormat<Tag extends string> = string & { __customType: Tag };
export type NumberFormat<Tag extends string> = number & { __customType: Tag };

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

export type ParseOptions = {
  disallowExtraProperties?: boolean;
};

export type BeffParser<T> = {
  parse: (input: any, options?: ParseOptions) => T;
  safeParse: (
    input: any,
    options?: ParseOptions,
  ) => { success: true; data: T } | { success: false; errors: DecodeError[] };
  zod: () => ZodType<T>;
  name: string;
  validate(input: any, options?: ParseOptions): input is T;
  schema: () => JSONSchema7;
};
type Parsers<T> = {
  [K in keyof T]: BeffParser<T[K]>;
};

export type TagOfFormat<T extends StringFormat<string>> = T extends StringFormat<infer Tag> ? Tag : never;
export type TagOfNumberFormat<T extends NumberFormat<string>> =
  T extends NumberFormat<infer Tag> ? Tag : never;

export type BuildParserFunction = <T>(args?: {
  stringFormats?: { [key: string]: (input: string) => boolean };
  numberFormats?: { [key: string]: (input: number) => boolean };
}) => Parsers<T>;

export type TypeOf<T> = T extends BeffParser<infer U> ? U : never;
