import {
  AnyOfRuntype,
  AnyRuntype,
  ArrayRuntype,
  buildParserFromRuntype,
  ConstRuntype,
  DateRuntype,
  NullishRuntype,
  ObjectRuntype,
  Runtype,
  TypedArrayRuntype,
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

const dateParser = buildParserFromRuntype(new DateRuntype(), "Date", true);
const Date_ = (): BeffParser<Date> => dateParser;

const uint8ArrayParser = buildParserFromRuntype(new TypedArrayRuntype("Uint8Array"), "Uint8Array", true);
const Uint8Array_ = (): BeffParser<Uint8Array> => uint8ArrayParser;
const uint8ClampedArrayParser = buildParserFromRuntype(new TypedArrayRuntype("Uint8ClampedArray"), "Uint8ClampedArray", true);
const Uint8ClampedArray_ = (): BeffParser<Uint8ClampedArray> => uint8ClampedArrayParser;
const uint16ArrayParser = buildParserFromRuntype(new TypedArrayRuntype("Uint16Array"), "Uint16Array", true);
const Uint16Array_ = (): BeffParser<Uint16Array> => uint16ArrayParser;
const uint32ArrayParser = buildParserFromRuntype(new TypedArrayRuntype("Uint32Array"), "Uint32Array", true);
const Uint32Array_ = (): BeffParser<Uint32Array> => uint32ArrayParser;
const int8ArrayParser = buildParserFromRuntype(new TypedArrayRuntype("Int8Array"), "Int8Array", true);
const Int8Array_ = (): BeffParser<Int8Array> => int8ArrayParser;
const int16ArrayParser = buildParserFromRuntype(new TypedArrayRuntype("Int16Array"), "Int16Array", true);
const Int16Array_ = (): BeffParser<Int16Array> => int16ArrayParser;
const int32ArrayParser = buildParserFromRuntype(new TypedArrayRuntype("Int32Array"), "Int32Array", true);
const Int32Array_ = (): BeffParser<Int32Array> => int32ArrayParser;
const float32ArrayParser = buildParserFromRuntype(new TypedArrayRuntype("Float32Array"), "Float32Array", true);
const Float32Array_ = (): BeffParser<Float32Array> => float32ArrayParser;
const float64ArrayParser = buildParserFromRuntype(new TypedArrayRuntype("Float64Array"), "Float64Array", true);
const Float64Array_ = (): BeffParser<Float64Array> => float64ArrayParser;
const bigInt64ArrayParser = buildParserFromRuntype(new TypedArrayRuntype("BigInt64Array"), "BigInt64Array", true);
const BigInt64Array_ = (): BeffParser<BigInt64Array> => bigInt64ArrayParser;
const bigUint64ArrayParser = buildParserFromRuntype(new TypedArrayRuntype("BigUint64Array"), "BigUint64Array", true);
const BigUint64Array_ = (): BeffParser<BigUint64Array> => bigUint64ArrayParser;

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
  return buildParserFromRuntype(new AnyOfRuntype(rts), "b.UnionUntyped", true);
};
export const buntyped = {
  Union: UnionUntyped_,
};
