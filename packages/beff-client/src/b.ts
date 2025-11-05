import { JSONSchema7 } from "./json-schema";
import { ParseOptions, DecodeError, BeffParser } from "./types";
import { z } from "zod";

const buildParserFromSafeParser = <T>(
  name: string,
  validate: (input: any, options?: ParseOptions) => input is T,
  safeParse: (
    input: any,
    options?: ParseOptions,
  ) => { success: true; data: T } | { success: false; errors: DecodeError[] },
  jsonSchema: () => JSONSchema7,
): BeffParser<T> => {
  const parse = (input: any, options?: ParseOptions) => {
    const safe = safeParse(input, options);
    if (safe.success) {
      return safe.data;
    }
    const error = new Error(`Failed to parse`);
    //@ts-ignore
    error.errors = safe.errors;
    throw error;
  };
  const zod = () => {
    //@ts-ignore
    return z.custom(
      (data: any) => safeParse(data).success,
      //@ts-ignore
      (val: any) => {
        const errors = (safeParse(val) as any).errors;
        //@ts-ignore
        return printErrors(errors, []);
      },
    );
  };

  return {
    safeParse,
    parse,
    //@ts-ignore
    zod,
    name,
    validate,
    schema: jsonSchema,
  };
};

const Object_ = <T extends Record<string, BeffParser<any>>>(
  fields: T,
): BeffParser<{
  [K in keyof T]: T[K] extends BeffParser<infer U> ? U : never;
}> =>
  buildParserFromSafeParser(
    "b.Object",
    (input: any, options?: ParseOptions): input is any => {
      const disallowExtraProperties = options?.disallowExtraProperties ?? false;

      if (typeof input !== "object" || input == null || Array.isArray(input)) {
        return false;
      }

      for (const key in fields) {
        if (!fields[key].validate(input[key])) {
          return false;
        }
      }

      if (disallowExtraProperties) {
        for (const key in input) {
          if (!fields[key]) {
            return false;
          }
        }
      }

      return true;
    },
    (input: any, options?: ParseOptions) => {
      if (typeof input !== "object" || input == null || Array.isArray(input)) {
        return {
          success: false,
          errors: [{ message: "Expected object", path: [], received: input }],
        };
      }

      const disallowExtraProperties = options?.disallowExtraProperties ?? false;

      const errors: DecodeError[] = [];
      const result = {} as any;

      for (const key in fields) {
        const field = fields[key];
        const res = field.safeParse(input[key]);
        if (res.success) {
          result[key] = res.data;
        } else {
          errors.push(...res.errors.map((it) => ({ ...it, path: [key, ...it.path] })));
        }
      }

      if (disallowExtraProperties) {
        for (const key in input) {
          if (!fields[key]) {
            errors.push({
              message: "Extra property",
              path: [key],
              received: input[key],
            });
          }
        }
      }
      if (errors.length > 0) {
        return { success: false, errors };
      }
      return { success: true, data: result };
    },
    () => ({
      type: "object",
      properties:
        //@ts-ignore
        Object.fromEntries(
          //@ts-ignore
          Object.entries(fields).map(([key, parser]) => [key, parser.schema()]),
        ),
    }),
  );

const String_ = (): BeffParser<string> =>
  buildParserFromSafeParser(
    "String",
    //@ts-ignore
    (input) => typeof input === "string",
    (input: any) => {
      if (typeof input === "string") {
        return { success: true, data: input };
      }
      return { success: false, errors: [{ message: "Expected string", path: [], received: input }] };
    },
    () => ({
      type: "string",
    }),
  );

const Number_ = (): BeffParser<number> =>
  buildParserFromSafeParser(
    "Number",
    //@ts-ignore
    (input) => typeof input === "number",
    (input: any) => {
      if (typeof input === "number") {
        return { success: true, data: input };
      }
      return { success: false, errors: [{ message: "Expected number", path: [], received: input }] };
    },
    () => ({
      type: "number",
    }),
  );

const Boolean_ = (): BeffParser<boolean> =>
  buildParserFromSafeParser(
    "Boolean",
    //@ts-ignore
    (input) => typeof input === "boolean",
    (input: any) => {
      if (typeof input === "boolean") {
        return { success: true, data: input };
      }
      return { success: false, errors: [{ message: "Expected boolean", path: [], received: input }] };
    },
    () => ({
      type: "boolean",
    }),
  );

const Undefined_ = (): BeffParser<undefined> =>
  buildParserFromSafeParser(
    "Undefined",
    (input): input is undefined => input == null,
    (input: any) => {
      if (input == undefined) {
        return { success: true, data: input };
      }
      return { success: false, errors: [{ message: "Expected undefined", path: [], received: input }] };
    },
    () => ({
      type: "null",
    }),
  );

const Void_ = (): BeffParser<void> =>
  buildParserFromSafeParser(
    "Void",
    //@ts-ignore
    (input): input is undefined => input == null,
    (input: any) => {
      if (input == undefined) {
        return { success: true, data: input };
      }
      return { success: false, errors: [{ message: "Expected void", path: [], received: input }] };
    },
    () => ({
      type: "null",
    }),
  );

const Null_ = (): BeffParser<undefined> =>
  buildParserFromSafeParser(
    "Null",
    (input): input is undefined => input == null,
    (input: any) => {
      if (input == null) {
        return { success: true, data: input };
      }
      return { success: false, errors: [{ message: "Expected null", path: [], received: input }] };
    },
    () => ({
      type: "null",
    }),
  );

const Any_ = (): BeffParser<any> =>
  buildParserFromSafeParser(
    "Any",
    //@ts-ignore
    (_input): _input is any => true,
    (input: any) => {
      return { success: true, data: input };
    },
    () => ({}),
  );

const Unknown_ = (): BeffParser<unknown> =>
  buildParserFromSafeParser(
    "Unknown",
    (_input): _input is unknown => true,
    (input: any) => {
      return { success: true, data: input };
    },
    () => ({}),
  );

const Array_ = <T>(parser: BeffParser<T>): BeffParser<T[]> =>
  buildParserFromSafeParser(
    "b.Array",
    //@ts-ignore
    (input: any): input is any => {
      if (!Array.isArray(input)) {
        return false;
      }
      for (let i = 0; i < input.length; i++) {
        if (!parser.validate(input[i])) {
          return false;
        }
      }
      return true;
    },
    (input: any) => {
      if (!Array.isArray(input)) {
        return {
          success: false,
          errors: [{ message: "Expected array", path: [], received: input }],
        };
      }
      const errors: DecodeError[] = [];
      const results: T[] = [];
      for (let i = 0; i < input.length; i++) {
        const res = parser.safeParse(input[i]);
        if (res.success) {
          results.push(res.data);
        } else {
          errors.push(...res.errors.map((it) => ({ ...it, path: [i.toString(), ...it.path] })));
        }
      }
      if (errors.length > 0) {
        return { success: false, errors };
      }
      return { success: true, data: results };
    },
    () => ({
      type: "array",
      items: parser.schema(),
    }),
  );

const ReadOnlyArray_ = <T>(parser: BeffParser<T>): BeffParser<readonly T[]> =>
  Array_(parser) as BeffParser<readonly T[]>;

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
};
