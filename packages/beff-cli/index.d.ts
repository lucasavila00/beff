export type Header<T> = T;
export type StringFormat<Tag extends string> = string & { __customType: Tag };

export type MetaParamServer = {
  type: "path" | "query" | "header" | "body" | "context";
  name: string;
  required: boolean;
  validator: any;
  encoder: any;
};
export type HandlerMetaServer = {
  method_kind: "get" | "post" | "put" | "delete" | "patch" | "options" | "use";
  pattern: string;
  return_validator: any;
  return_encoder: any;
  params: MetaParamServer[];
};
export type RegularDecodeError = {
  message: string;
  path: string[];
  received: unknown;
};
export type UnionDecodeError = {
  path: string[];
  received: unknown;
  isUnionError: true;
  errors: DecodeError[];
};
export type DecodeError = RegularDecodeError | UnionDecodeError;
