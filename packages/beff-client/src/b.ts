import {
  any,
  arr,
  bool,
  buildParserFromRuntype,
  date,
  lit,
  nul,
  num,
  obj,
  Runtype,
  str,
  typedArray,
  undef,
  union,
  voidType,
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
  return buildParserFromRuntype(obj(props), "b.Object", true);
};
const stringParser = buildParserFromRuntype(str(), "String", true);
const String_ = (): BeffParser<string> => stringParser;

const numberParser = buildParserFromRuntype(num(), "Number", true);
const Number_ = (): BeffParser<number> => numberParser;

const booleanParser = buildParserFromRuntype(bool(), "Boolean", true);
const Boolean_ = (): BeffParser<boolean> => booleanParser;

const undefinedParser = buildParserFromRuntype(undef(), "Undefined", true);
const Undefined_ = (): BeffParser<undefined> => undefinedParser;

const voidParser = buildParserFromRuntype(voidType(), "Void", true);
const Void_ = (): BeffParser<void> => voidParser;

const nullParser = buildParserFromRuntype(nul(), "Null", true);
const Null_ = (): BeffParser<null> => nullParser;

const anyParser = buildParserFromRuntype(any(), "Any", true);
const Any_ = (): BeffParser<any> => anyParser;

const unknwonParser = buildParserFromRuntype(any(), "Unknown", true);
const Unknown_ = (): BeffParser<unknown> => unknwonParser;

const dateParser = buildParserFromRuntype(date(), "Date", true);
const Date_ = (): BeffParser<Date> => dateParser;

const typedArrayParser = <T>(ctorName: string) => {
  const parser: BeffParser<T> = buildParserFromRuntype(typedArray(ctorName), ctorName, true);
  return () => parser;
};
const Uint8Array_ = typedArrayParser<Uint8Array>("Uint8Array");
const Uint8ClampedArray_ = typedArrayParser<Uint8ClampedArray>("Uint8ClampedArray");
const Uint16Array_ = typedArrayParser<Uint16Array>("Uint16Array");
const Uint32Array_ = typedArrayParser<Uint32Array>("Uint32Array");
const Int8Array_ = typedArrayParser<Int8Array>("Int8Array");
const Int16Array_ = typedArrayParser<Int16Array>("Int16Array");
const Int32Array_ = typedArrayParser<Int32Array>("Int32Array");
const Float32Array_ = typedArrayParser<Float32Array>("Float32Array");
const Float64Array_ = typedArrayParser<Float64Array>("Float64Array");
const BigInt64Array_ = typedArrayParser<BigInt64Array>("BigInt64Array");
const BigUint64Array_ = typedArrayParser<BigUint64Array>("BigUint64Array");

const Array_ = <T>(parser: BeffParser<T>): BeffParser<T[]> =>
  buildParserFromRuntype(arr((parser as any)._runtype), "b.Array", true);

const ReadOnlyArray_ = <T>(parser: BeffParser<T>): BeffParser<readonly T[]> =>
  Array_(parser) as BeffParser<readonly T[]>;

const Const_ = <const T extends string | number | boolean>(value: T): BeffParser<T> => {
  return buildParserFromRuntype(lit(value), `b.Const`, true) as BeffParser<T>;
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
  Date: Date_,
  Uint8Array: Uint8Array_,
  Uint8ClampedArray: Uint8ClampedArray_,
  Uint16Array: Uint16Array_,
  Uint32Array: Uint32Array_,
  Int8Array: Int8Array_,
  Int16Array: Int16Array_,
  Int32Array: Int32Array_,
  Float32Array: Float32Array_,
  Float64Array: Float64Array_,
  BigInt64Array: BigInt64Array_,
  BigUint64Array: BigUint64Array_,
};

const UnionUntyped_ = (...parsers: BeffParser<any>[]): BeffParser<any> => {
  const rts = parsers.map((p) => (p as any)._runtype);
  return buildParserFromRuntype(union(rts), "b.UnionUntyped", true);
};
export const buntyped = {
  Union: UnionUntyped_,
};
