
import { DecodeError,StringFormat} from "@beff/cli";

export type BeffParser<T> = {
  parse: (input: any) => T;
  safeParse: (
    input: any
  ) => { success: true; data: T } | { success: false; errors: DecodeError[] };
};
type Parsers<T> = {
  [K in keyof T]: BeffParser<T[K]>;
};
export declare const buildParsers: <T>() => Parsers<T>;

export type TagOfFormat<T extends StringFormat<string>> =
  T extends StringFormat<infer Tag> ? Tag : never;
export declare function registerStringFormat<T extends StringFormat<string>>(
  name: TagOfFormat<T>,
  isValid: (it: string) => boolean
): void;
