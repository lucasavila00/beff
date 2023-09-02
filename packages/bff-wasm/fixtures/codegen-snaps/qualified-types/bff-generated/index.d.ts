
import {JSONSchema7, HandlerMeta} from "bff-types";
export declare const meta: HandlerMeta[];
export declare const schema: JSONSchema7;


type Decoders<T> = {
  [K in keyof T]: {
    parse: (input: any) => T[K];
  };
};
export declare const buildParsers: <T>() => Decoders<T>;
