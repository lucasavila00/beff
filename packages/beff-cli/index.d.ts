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
export type DecodeError = {
  message: string;
  path: string[];
  received: unknown;
};
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
