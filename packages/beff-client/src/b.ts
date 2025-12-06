import {
  AnyOfRuntype,
  AnyRuntype,
  ArrayRuntype,
  buildParserFromRuntype,
  ConstRuntype,
  NullishRuntype,
  ObjectRuntype,
  Runtype,
  TypeofRuntype,
} from "./codegen-v2.js";
import { BeffParser } from "./types.js";

const Object_ = <T extends Record<string, BeffParser<any>>>(
  fields: T,
): BeffParser<{
  [K in keyof T]: T[K] extends BeffParser<infer U> ? U : never;
}> => {
  const props: Record<string, Runtype> = {};
  for (const key of Object.keys(fields)) {
    props[key] = (fields[key] as any)._runtype;
  }
  return buildParserFromRuntype(new ObjectRuntype(props, []), "b.Object", true);
};
const stringParser = buildParserFromRuntype(new TypeofRuntype("string"), "String", true);
const String_ = (): BeffParser<string> => stringParser;

const numberParser = buildParserFromRuntype(new TypeofRuntype("number"), "Number", true);
const Number_ = (): BeffParser<number> => numberParser;

const booleanParser = buildParserFromRuntype(new TypeofRuntype("boolean"), "Boolean", true);
const Boolean_ = (): BeffParser<boolean> => booleanParser;

const undefinedParser = buildParserFromRuntype(new NullishRuntype("undefined"), "Undefined", true);
const Undefined_ = (): BeffParser<undefined> => undefinedParser;

const voidParser = buildParserFromRuntype(new NullishRuntype("void"), "Void", true);
const Void_ = (): BeffParser<void> => voidParser;

const nullParser = buildParserFromRuntype(new NullishRuntype("null"), "Null", true);
const Null_ = (): BeffParser<undefined> => nullParser;

const anyParser = buildParserFromRuntype(new AnyRuntype(), "Any", true);
const Any_ = (): BeffParser<any> => anyParser;

const unknwonParser = buildParserFromRuntype(new AnyRuntype(), "Unknown", true);
const Unknown_ = (): BeffParser<unknown> => unknwonParser;

const Array_ = <T>(parser: BeffParser<T>): BeffParser<T[]> =>
  buildParserFromRuntype(new ArrayRuntype((parser as any)._runtype), "b.Array", true);

const ReadOnlyArray_ = <T>(parser: BeffParser<T>): BeffParser<readonly T[]> =>
  Array_(parser) as BeffParser<readonly T[]>;

const Const_ = <const T extends string | number | boolean>(value: T): BeffParser<T> => {
  return buildParserFromRuntype(new ConstRuntype(value), `b.Const`, true) as BeffParser<T>;
};

export const b = {
  Object: Object_,
  String: String_,
  Number: Number_,
  Boolean: Boolean_,
  Array: Array_,
  Undefined: Undefined_,
  Null: Null_,
  Any: Any_,
  Unknown: Unknown_,
  Void: Void_,
  ReadOnlyArray: ReadOnlyArray_,
  Const: Const_,
};

const UnionUntyped_ = (...parsers: BeffParser<any>[]): BeffParser<any> => {
  const rts = parsers.map((p) => (p as any)._runtype);
  return buildParserFromRuntype(new AnyOfRuntype(rts), "b.UnionUntyped", true);
};
export const buntyped = {
  Union: UnionUntyped_,
};
