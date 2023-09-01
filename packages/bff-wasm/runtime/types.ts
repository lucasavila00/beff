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

export type DecodeErrorKind = ["NotTypeof", string];
export type DecodeError = {
  kind: DecodeErrorKind;
  path: string[];
};
export type OpenApiServer = any;
