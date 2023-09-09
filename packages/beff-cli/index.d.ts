export type Header<T> = T;
export type StringFormat<Tag extends string> = string & { __customType: Tag };

export type MetaParamClient = {
  type: "path" | "query" | "header" | "body" | "context";
  name: string;
  required: boolean;
};

export type MetaParamServer = MetaParamClient & {
  validator: any;
  coercer: any;
};
export type HandlerMetaClient = {
  method_kind: "get" | "post" | "put" | "delete" | "patch" | "options" | "use";
  params: MetaParamClient[];
  pattern: string;
};
export type HandlerMetaServer = HandlerMetaClient & {
  return_validator: any;
  params: MetaParamServer[];
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

export interface OpenAPIInfo {
  title?: string;
  description?: string;
  version?: string;
  license?: {
    name?: string;
    url?: string;
  };
}

export type OpenAPIPathObject = Record<string, OpenAPIOperationObject> & {
  parameters?: OpenAPIParameterObject[];
};

export interface OpenAPIParameterObject {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  schema?: any;
}

export interface OpenAPIRequestBodyObject {
  content?: Record<string, OpenAPIMediaTypeObject>;
}

export interface OpenAPIOperationObject {
  operationId?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenAPIParameterObject[];
  requestBody?: OpenAPIRequestBodyObject;
  responses?: Record<string | number, OpenAPIResponseObject>;
}

export interface OpenAPIResponseObject {
  description?: string;
  content?: Record<string, OpenAPIMediaTypeObject>;
}

export interface OpenAPIMediaTypeObject {
  schema?: any;
}

export type OpenApiServer = {
  url: string;
};

export type OpenAPIDocument = {
  openapi?: string;
  info?: OpenAPIInfo;
  servers?: OpenApiServer[];
  paths?: Record<string, OpenAPIPathObject>;
  components?: unknown;
};
