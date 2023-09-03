
import { DecodeError,StringFormat} from "@beff/cli";

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

export type TagOfFormat<T extends StringFormat<string>> =
  T extends StringFormat<infer Tag> ? Tag : never;
export declare function registerStringFormat<T extends StringFormat<string>>(
  name: TagOfFormat<T>,
  isValid: (it: string) => boolean
): void;
