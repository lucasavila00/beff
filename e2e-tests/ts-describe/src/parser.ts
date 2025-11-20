import parse from "./generated/parser";
import { StringFormat } from "@beff/client";

export type ValidCurrency = StringFormat<"ValidCurrency">;

type T1 = {
  a: string;
  b: number;
};

type T2 = {
  t1: T1;
};

type T3 = {
  t2Array: T2[];
};

type InvalidSchemaWithDate = {
  x: Date;
};

type InvalidSchemaWithBigInt = {
  x: bigint;
};
type DiscriminatedUnion =
  | {
      type: "a";
      subType: "a1";
      a1: string;
      a11?: string;
    }
  | {
      type: "a";
      subType: "a2";
      a2: string;
    }
  | {
      type: "b";
      value: number;
    };

type RecursiveTree = {
  value: number;
  children: RecursiveTree[];
};

type SemVer = `${number}.${number}.${number}`;

type NonEmptyString = [string, ...string[]];

type ReusesRef = {
  a: T3;
  b: T3;
};

type GenericWrapper<T> = {
  value: T;
  value2: T | boolean;
  other: GenericWrapper<T>;
};

type UsesGenericWrapper = {
  wrappedString: GenericWrapper<string>;
  wrappedNumber: GenericWrapper<number>;
};

export const Codecs = parse.buildParsers<{
  // basic
  string: string;
  number: number;
  boolean: boolean;
  null: null;
  undefined: undefined;
  object: object;
  anyArray: any[];
  any: any;
  //
  T1: T1;
  T2: T2;
  T3: T3;
  InvalidSchemaWithDate: InvalidSchemaWithDate;
  InvalidSchemaWithBigInt: InvalidSchemaWithBigInt;
  DiscriminatedUnion: DiscriminatedUnion;
  RecursiveTree: RecursiveTree;
  SemVer: SemVer;
  NonEmptyString: NonEmptyString;
  //
  ValidCurrency: ValidCurrency;
  ReusesRef: ReusesRef;
  // UsesGenericWrapper: UsesGenericWrapper;
}>({
  stringFormats: {
    ValidCurrency: (input: string) => {
      if (input === "USD") {
        return true;
      }
      return false;
    },
  },
});
