import type { ZodType } from "zod";
import { JSONSchema7 } from "./json-schema";

export type StringFormat<Tag1 extends string> = string & { __customType1: Tag1 };
type StringFormat2<Tag1 extends string, Tag2 extends string> = string & {
  __customType1: Tag1;
  __customType2: Tag2;
};
type StringFormat3<Tag1 extends string, Tag2 extends string, Tag3 extends string> = string & {
  __customType1: Tag1;
  __customType2: Tag2;
  __customType3: Tag3;
};
type StringFormat4<
  Tag1 extends string,
  Tag2 extends string,
  Tag3 extends string,
  Tag4 extends string,
> = string & {
  __customType1: Tag1;
  __customType2: Tag2;
  __customType3: Tag3;
  __customType4: Tag4;
};

export type StringFormatExtends<Base, TagNext extends string> =
  Base extends StringFormat3<infer T1, infer T2, infer T3>
    ? StringFormat4<T1, T2, T3, TagNext>
    : Base extends StringFormat2<infer T1, infer T2>
      ? StringFormat3<T1, T2, TagNext>
      : Base extends StringFormat<infer T1>
        ? StringFormat2<T1, TagNext>
        : never;

export type NumberFormat<Tag1 extends string> = string & { __customType1: Tag1 };
type NumberFormat2<Tag1 extends string, Tag2 extends string> = string & {
  __customType1: Tag1;
  __customType2: Tag2;
};
type NumberFormat3<Tag1 extends string, Tag2 extends string, Tag3 extends string> = string & {
  __customType1: Tag1;
  __customType2: Tag2;
  __customType3: Tag3;
};
type NumberFormat4<
  Tag1 extends string,
  Tag2 extends string,
  Tag3 extends string,
  Tag4 extends string,
> = string & {
  __customType1: Tag1;
  __customType2: Tag2;
  __customType3: Tag3;
  __customType4: Tag4;
};

export type NumberFormatExtends<Base, TagNext extends string> =
  Base extends NumberFormat3<infer T1, infer T2, infer T3>
    ? NumberFormat4<T1, T2, T3, TagNext>
    : Base extends NumberFormat2<infer T1, infer T2>
      ? NumberFormat3<T1, T2, TagNext>
      : Base extends NumberFormat<infer T1>
        ? NumberFormat2<T1, TagNext>
        : never;

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

export type BuildParserFunction = <T>(args?: {
  stringFormats?: { [key: string]: (input: string) => boolean };
  numberFormats?: { [key: string]: (input: number) => boolean };
}) => Parsers<T>;

export type TypeOf<T> = T extends BeffParser<infer U> ? U : never;
