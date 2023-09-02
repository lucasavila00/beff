
import {JSONSchema7, HandlerMeta} from "bff-types";
export declare const meta: HandlerMeta[];
export declare const schema: JSONSchema7;


import {JSONSchema7, HandlerMeta} from "bff-types";
type Decoders<T> = {
  [K in keyof T]: {
    parse: (input: any) => T[K];
  };
};
export declare const buildDecoders: <T>() => Decoders<T>;
