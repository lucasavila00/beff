import {
  StringCodec,
  NumberCodec,
  BooleanCodec,
  StringArrayCodec,
  UndefinedCodec,
  NullCodec,
  AnyCodec,
  UnknownCodec,
  VoidCodec,
  ObjCodec,
  ObjCodec2,
} from "../tests/b.test";
import parse from "./generated/parser";
import { StringFormat } from "@beff/client";

export type ValidCurrency = StringFormat<"ValidCurrency">;

export const Codecs = parse.buildParsers<{
  StringCodec: StringCodec;
  NumberCodec: NumberCodec;
  BooleanCodec: BooleanCodec;
  StringArrayCodec: StringArrayCodec;
  UndefinedCodec: UndefinedCodec;
  NullCodec: NullCodec;
  AnyCodec: AnyCodec;
  UnknownCodec: UnknownCodec;
  VoidCodec: VoidCodec;
  ObjCodec: ObjCodec;
  ObjCodec2: ObjCodec2;
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
