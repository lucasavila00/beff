import type { Hono } from "hono";
import { DecodeError, HandlerMeta, MetaParam, OpenApiServer } from "@beff/cli";
import { getCookie } from "hono/cookie";
import { buildStableClient, ClientFromRouter } from "@beff/client";

export const template = `
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
import type { Context as HonoContext, Env } from "hono";
export type Ctx<T = {}, E extends Env = any> = T & { hono: HonoContext<E> };

const coerce = (coercer: any, value: any): any => {
  return coercer(value);
};

const toHonoPattern = (pattern: string): string => {
  // replace {id} with :id
  return pattern.replace(/\{(\w+)\}/g, ":$1");
};

class BffHTTPException extends Error {
  isBffHttpException: true;
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HTTPException";
    this.isBffHttpException = true;
    this.status = status;
  }
}
export const isBffHttpException = (e: any): e is BffHTTPException => {
  return e?.isBffHttpException;
};

const prettyPrintErrorMessage = (it: DecodeError): string => {
  switch (it.error_kind) {
    case "NotTypeof": {
      return `Expected ${it.expected_type}`;
    }
    case "NotEq": {
      return `Expected ${prettyPrintValue(it.expected_value)}`;
    }
    case "StringFormatCheckFailed": {
      return `Expected ${it.expected_type}`;
    }
    default: {
      return it.error_kind;
    }
  }
};

const prettyPrintValue = (it: unknown): string => {
  if (typeof it === "string") {
    return `"${it}"`;
  }
  if (typeof it === "number") {
    return `${it}`;
  }
  if (typeof it === "boolean") {
    return `${it}`;
  }
  if (it === null) {
    return "null";
  }
  if (Array.isArray(it)) {
    return `Array`;
  }
  if (typeof it === "object") {
    return `Object`;
  }
  return JSON.stringify(it);
};
const prettyPrintError = (it: DecodeError): string => {
  return [
    prettyPrintErrorMessage(it),
    `Path: ${it.path.join(".")}`,
    `Received: ${prettyPrintValue(it.received)}`,
  ].join(" ~ ");
};
const MAX_ERRORS = 5;

const printAndJoin = (errors: DecodeError[]): string => {
  return errors
    .map((it, idx) => `Error #${idx + 1}: ` + prettyPrintError(it))
    .join(" | ");
};
const prettyPrintErrors = (errors: DecodeError[]): string => {
  if (errors.length > MAX_ERRORS) {
    const split = errors.slice(0, MAX_ERRORS);
    const omitted = errors.length - MAX_ERRORS;
    return printAndJoin(split) + `... ${omitted} more`;
  }
  return printAndJoin(errors);
};

const decodeWithMessage = (validator: any, value: any) => {
  const errors = validator(value);
  if (errors.length > 0) {
    throw new BffHTTPException(422, prettyPrintErrors(errors));
  }
  return value;
};
const decodeNoMessage = (validator: any, value: any) => {
  const errors = validator(value);

  if (errors.length > 0) {
    throw new BffHTTPException(500, "Internal error");
  }
  return value;
};

const handleMethod = async (c: Ctx, meta: HandlerMeta, handler: Function) => {
  const resolverParamsPromise: any[] = meta.params.map(async (p: MetaParam) => {
    switch (p.type) {
      case "path": {
        const value = c.hono.req.param(p.name);
        const coerced = coerce(p.coercer, value);
        return decodeWithMessage(p.validator, coerced);
      }
      case "query": {
        const value = c.hono.req.query(p.name);
        const coerced = coerce(p.coercer, value);
        return decodeWithMessage(p.validator, coerced);
      }
      case "cookie": {
        const value = getCookie(c.hono, p.name);
        const coerced = coerce(p.coercer, value);
        return decodeWithMessage(p.validator, coerced);
      }
      case "header": {
        const value = c.hono.req.header(p.name);
        const coerced = coerce(p.coercer, value);
        return decodeWithMessage(p.validator, coerced);
      }
      case "body": {
        const value = await c.hono.req.json();
        return decodeWithMessage(p.validator, value);
      }
      case "context": {
        return c;
      }
    }
    throw new Error("not implemented: " + p.type);
  });
  const resolverParams = await Promise.all(resolverParamsPromise);
  const result = await handler(...resolverParams);
  return c.hono.json(decodeNoMessage(meta.return_validator, result));
};
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

export function registerRouter(options: {
  app: Hono<any, any, any>;
  router: any;
  openApi?: { servers: OpenApiServer[] };
  context?: any;
  schema: any;
  meta: HandlerMeta[];
}) {
  registerDocs(options.app, options.schema, options.openApi?.servers ?? []);
  const handlersMeta: HandlerMeta[] = options.meta;
  for (const meta of handlersMeta) {
    const handlerData = options.router[meta.pattern][meta.method_kind];
    if (handlerData == null) {
      throw new Error(
        "handler not found: " + meta.method_kind + "  " + meta.pattern
      );
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
        app[meta.method_kind](toHonoPattern(meta.pattern), async (c: any) => {
          try {
            return await handleMethod({ hono: c }, meta, handlerData);
          } catch (e) {
            if (isBffHttpException(e)) {
              return c.json(
                {
                  message: e.message,
                },
                e.status
              );
            }
            throw e;
          }
        });
        break;
      }
      default: {
        throw new Error("Method not recognized: " + meta.method_kind);
      }
    }
  }
}

export const buildHonoTestClient = <T>(
  meta: HandlerMeta[],
  app: Hono<any, any, any>,
  env?: any,
  executionContext?: any
): ClientFromRouter<T> =>
  buildStableClient<T>(meta, async (req) => {
    const r = await app.fetch(
      //@ts-ignore
      new Request("http://localhost" + req.url, {
        method: req.method,
        headers: {
          ...req.headers,
          "content-type": "application/json",
          cookie: req.cookies.join(";"),
        },
        body: req.requestBodyStringified,
      }),
      env,
      executionContext
    );
    if (r.ok) {
      return r.json();
    }
    const text = await r.text();
    try {
      const json = JSON.parse(text);
      throw new BffHTTPException(r.status, json.message);
    } catch (e) {
      if (isBffHttpException(e)) {
        throw e;
      }
      throw new BffHTTPException(r.status, text);
    }
  });
