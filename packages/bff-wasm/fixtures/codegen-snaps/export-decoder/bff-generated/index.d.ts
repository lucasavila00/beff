
import {JSONSchema7, HandlerMeta, DecodeError} from "bff-types";
export declare const meta: HandlerMeta[];
export declare const schema: JSONSchema7;


type Decoders<T> = {
  [K in keyof T]: {
    parse: (input: any) => T[K];
    safeParse: (
      input: any
    ) =>
      | { success: true; data: T[K] }
      | { success: false; errors: DecodeError[] };
  };
};
export declare const buildParsers: <T>() => Decoders<T>;
