import { Hono, Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCookie } from "hono/cookie";
type MetaParam = {
  type: "path" | "query" | "cookie" | "header" | "body";
  name: string;
  required: boolean;
  validator: any;
  coercer: any;
};
type HandlerMeta = {
  method_kind: "get" | "post" | "put" | "delete" | "patch" | "options" | "use";
  params: MetaParam[];
  pattern: string;
  return_validator: any;
};

type DecodeErrorKind = ["NotTypeof", string];
type DecodeError = {
  kind: DecodeErrorKind;
  path: string[];
};

function add_path_to_errors(errors: DecodeError[], path: string[]) {
  return errors.map((e) => ({ ...e, path: [...path, ...e.path] }));
}
function coerce_string(input: unknown) {
  return input;
}
class CoercionFailure {}
const isNumeric = (num: unknown) =>
  (typeof num === "number" || (typeof num === "string" && num.trim() !== "")) &&
  !isNaN(num as any);
function coerce_number(input: unknown) {
  if (isNumeric(input)) {
    return Number(input);
  }
  return new CoercionFailure();
}
function coerce_boolean(input: unknown) {
  if (input === "true" || input === "false") {
    return input === "true";
  }
  if (input === "1" || input === "0") {
    return input === "1";
  }
  return new CoercionFailure();
}
function coerce_union(input: unknown, ...cases: unknown[]) {
  for (const c of cases) {
    const r = coerce(c, input);
    if (!(r instanceof CoercionFailure)) {
      return r;
    }
  }
  return new CoercionFailure();
}

const template = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="description"
      content="SwaggerUI"
    />
    <title>SwaggerUI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css" />
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui.css" />

  </head>
  <body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v3/openapi.json',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
      });
    };
  </script>
  </body>
</html>
`;

const registerDocs = (
  app: Hono<any, any, any>,
  metadata: any,
  servers: any
) => {
  app.get("/v3/openapi.json", (req) =>
    req.json({
      ...metadata["schema"],
      servers,
    })
  );

  app.get("/docs", (c) => c.html(template));
};

const printKind = (kind: DecodeErrorKind): string => {
  switch (kind[0]) {
    case "NotTypeof": {
      return `expected ${kind[1]}`;
    }
    default: {
      return "unknown";
    }
  }
};
const printValidationErrors = (errors: DecodeError[]): string => {
  return errors
    .map((e) => {
      return `Decoder error at ${e.path.join(".")}: ${printKind(e.kind)}.`;
    })
    .join("\n");
};

const decodeWithMessage = (validator: any, value: any): any => {
  const errs = validator(value);
  if (errs.length > 0) {
    throw new HTTPException(422, { message: printValidationErrors(errs) });
  }
  return value;
};
const decodeNoMessage = (validator: any, value: any): any => {
  const errs = validator(value);
  if (errs.length > 0) {
    throw new HTTPException(422, { message: "Internal validation error" });
  }
  return value;
};
const coerce = (coercer: any, value: any): any => {
  return coercer(value);
};

const handleMethod = async (
  c: Context<any, any>,
  meta: HandlerMeta,
  handler: Function
) => {
  const resolverParamsPromise: any[] = meta.params.map(async (p: MetaParam) => {
    switch (p.type) {
      case "path": {
        const value = c.req.param(p.name);
        const coerced = coerce(p.coercer, value);
        return decodeWithMessage(p.validator, coerced);
      }
      case "query": {
        const value = c.req.query(p.name);
        const coerced = coerce(p.coercer, value);
        return decodeWithMessage(p.validator, coerced);
      }
      case "cookie": {
        const value = getCookie(c, p.name);
        const coerced = coerce(p.coercer, value);
        return decodeWithMessage(p.validator, coerced);
      }
      case "header": {
        const value = c.req.header(p.name);
        const coerced = coerce(p.coercer, value);
        return decodeWithMessage(p.validator, coerced);
      }
      case "body": {
        const value = await c.req.json();
        return decodeWithMessage(p.validator, value);
      }
    }
    throw new Error("not implemented: " + p.type);
  });
  const resolverParams = await Promise.all(resolverParamsPromise);
  const result = await handler(...resolverParams);
  return c.json(decodeNoMessage(meta.return_validator, result));
};

const toHonoPattern = (pattern: string): string => {
  // replace {id} with :id
  return pattern.replace(/\{(\w+)\}/g, ":$1");
};
type OpenApiServer = any;
declare const meta: any;
export function registerRouter(options: {
  app: Hono<any, any, any>;
  router: any;
  openApi?: { servers: OpenApiServer[] };
}) {
  registerDocs(options.app, meta, options.openApi?.servers ?? []);
  const handlersMeta: HandlerMeta[] = meta["handlersMeta"];
  for (const meta of handlersMeta) {
    const key = `${meta.method_kind.toUpperCase()}${meta.pattern}`;
    const handlerData = options.router[key];
    if (handlerData == null) {
      throw new Error("handler not found: " + key);
    }
    const app = options.app;
    switch (meta.method_kind) {
      case "use": {
        if (Array.isArray(handlerData)) {
          for (const h of handlerData) {
            app.use(meta.pattern, h);
          }
        } else {
          app.use(meta.pattern, handlerData);
        }
        break;
      }
      case "get":
      case "post":
      case "put":
      case "delete":
      case "patch":
      case "options": {
        app[meta.method_kind](toHonoPattern(meta.pattern), async (c: any) =>
          handleMethod(c, meta, handlerData)
        );
        break;
      }
      default: {
        throw new Error("Method not recognized: " + meta.method_kind);
      }
    }
  }
}

// This file is generated by swc-bff
// Do not edit this file manually
type Decoder<T> = { parse: (value: unknown) => T };
type DecodersOfKV<T> = {
  [K in keyof T]: Decoder<T[K]>;
};
export declare const buildDecoders: <T>() => DecodersOfKV<T>;

export type Header<T> = T;
export type Cookie<T> = T;

export const todo = <T>(): T => {
  throw new Error("TODO: not implemented");
};

export type NormalizeRouterItem<T> = T extends (
  ...deps: any
) => (...args: infer I) => Promise<infer O>
  ? [I, O]
  : T extends (...args: infer I) => Promise<infer O>
  ? [I, O]
  : T extends (...args: infer I) => infer O
  ? [I, O]
  : never;
export type SimpleHttpFunction<M extends [any[], any]> = (
  ...args: M[0]
) => Promise<M[1]>;

export type ClientFromRouter<R> = {
  [K in keyof R]: {
    [M in keyof R[K]]: SimpleHttpFunction<NormalizeRouterItem<R[K][M]>>;
  };
};

type Response = any;
type RequestInit = any;
export function buildFetchClient(
  fetcher: (url: string, info: RequestInit) => Response | Promise<Response>,
  options: {
    baseUrl: string;
  }
) {
  const client: any = {};
  const handlersMeta: HandlerMeta[] = meta["handlersMeta"];
  for (const meta of handlersMeta) {
    const key = `${meta.method_kind.toUpperCase()}${meta.pattern}`;

    client[key] = async (...params: any) => {
      let url = options.baseUrl + meta.pattern;
      const init: RequestInit = {
        method: meta.method_kind.toUpperCase(),
      };
      let hasAddedQueryParams = false;

      for (let index = 0; index < meta.params.length; index++) {
        const metadata = meta.params[index];
        const param = params[index];
        switch (metadata.type) {
          case "path": {
            url = url.replace(`{${metadata.name}}`, param);
            break;
          }
          case "query": {
            if (!hasAddedQueryParams) {
              url += "?";
              hasAddedQueryParams = true;
            }
            url += `${metadata.name}=${param}&`;
            break;
          }
          case "header": {
            if (init.headers == null) {
              init.headers = {};
            }
            init.headers[metadata.name] = param;
            break;
          }
          case "cookie": {
            if (init.headers == null) {
              init.headers = {};
            }
            init.headers["cookie"] = `${metadata.name}=${param}`;
            break;
          }
          case "body": {
            init.body = JSON.stringify(param);
            break;
          }
          default: {
            throw new Error("not implemented: " + metadata.type);
          }
        }
      }

      const resp = await fetcher(url, init);
      if (resp.ok) {
        return resp.json();
      } else {
        throw new Error(await resp.text());
      }
    };
  }
  return client;
}
