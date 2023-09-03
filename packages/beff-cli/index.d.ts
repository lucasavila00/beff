export type Header<T> = T;
export type Cookie<T> = T;
export type StringFormat<Tag extends string> = string & { __customType: Tag };

export namespace Formats {
  // TODO: more formats
  export type Password = StringFormat<"password">;
}

// TODO: validator and coercer are server specific, move these types to server, duplicate in client
export type MetaParam = {
  type: "path" | "query" | "cookie" | "header" | "body" | "context";
  name: string;
  required: boolean;
  validator: any;
  coercer: any;
};
export type HandlerMeta = {
  method_kind: "get" | "post" | "put" | "delete" | "patch" | "options" | "use";
  params: MetaParam[];
  pattern: string;
  return_validator: any;
};

export type ErrorVariant<T> = {
  error_kind: T;
  path: string[];
  received: unknown;
};
export type DecodeError =
  | ErrorVariant<"NotAnObject">
  | ErrorVariant<"NotAnArray">
  | ErrorVariant<"InvalidUnion">
  | (ErrorVariant<"StringFormatCheckFailed"> & {
      expected_type: string;
    })
  | (ErrorVariant<"NotTypeof"> & {
      expected_type: string;
    })
  | (ErrorVariant<"NotEq"> & {
      expected_value: unknown;
    });

// TODO: fix me
export type OpenApiServer = any;
