import parse from "./generated/parser";
import { StringFormat } from "@beff/cli";

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

  //
  ValidCurrency: ValidCurrency;
}>({
  customFormats: {
    ValidCurrency: (input: string) => {
      if (input === "USD") {
        return true;
      }
      return false;
    },
  },
});
