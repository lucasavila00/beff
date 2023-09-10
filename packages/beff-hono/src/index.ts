import { Hono } from "hono";
import {
  DecodeError,
  HandlerMetaClient,
  HandlerMetaServer,
  MetaParamServer,
  OpenAPIDocument,
  OpenApiServer,
} from "@beff/cli";
import { ClientFromRouter, buildClient } from "@beff/client";
import type { Context as HonoContext, Env } from "hono";

export type Ctx<C = {}, E extends Env = any> = C & {
  hono: HonoContext<E>;
};
const swaggerTemplate = (baseUrl: string) => `
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
        url: '${baseUrl}/v3/openapi.json',
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
const redocTemplate = (baseUrl: string) => `
<!DOCTYPE html>
<html>
  <head>
    <title>Redoc</title>
    <!-- needed for adaptive design -->
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">

    <!--
    Redoc doesn't change outer page styles
    -->
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <redoc spec-url='${baseUrl}/v3/openapi.json'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
  </body>
</html>
`;

const coerce = (coercer: any, value: any): any => {
  return coercer(value).data;
};

const toHonoPattern = (pattern: string): string => {
  // replace {id} with :id
  return pattern.replace(/\{(\w+)\}/g, ":$1");
};

class BffHTTPException extends Error {
  isBeffHttpException: true;
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HTTPException";
    this.isBeffHttpException = true;
    this.status = status;
  }
}
export const isBeffHttpException = (e: any): e is BffHTTPException => {
  return e?.isBeffHttpException;
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

const handleMethod = async (
  c: Ctx,
  meta: HandlerMetaServer,
  handler: Function
) => {
  const resolverParamsPromise: any[] = meta.params.map(
    async (p: MetaParamServer) => {
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
    }
  );
  const resolverParams = await Promise.all(resolverParamsPromise);
  const result = await handler(...resolverParams);
  return c.hono.json(decodeNoMessage(meta.return_validator, result));
};

const registerDocs = (app: Hono<any, any, any>, schema: any) => {
  app.get("/v3/openapi.json", (req) => req.json(schema));
  app.get("/docs", (c) =>
    c.html(swaggerTemplate(c.req.url.replace("/docs", "")))
  );
  app.get("/redoc", (c) =>
    c.html(redocTemplate(c.req.url.replace("/redoc", "")))
  );
};

export function buildHonoApp(options: {
  router: any;
  servers?: OpenApiServer[];
  transformOpenApiDocument?: (it: OpenAPIDocument) => OpenAPIDocument;
  generated: {
    schema: any;
    meta: HandlerMetaServer[];
  };
  context?: Object;
}): Hono<Env, any, any> {
  const app = new Hono({ strict: false });
  let schema = { ...options.generated.schema, servers: options.servers ?? [] };
  const transformOpenApiDocument = options.transformOpenApiDocument;
  if (transformOpenApiDocument != null) {
    schema = transformOpenApiDocument(schema);
  }
  registerDocs(app, schema);
  const handlersMeta: HandlerMetaServer[] = options.generated.meta;
  for (const meta of handlersMeta) {
    const handlerData = options.router[meta.pattern][meta.method_kind];
    if (handlerData == null) {
      throw new Error(
        "handler not found: " + meta.method_kind + "  " + meta.pattern
      );
    }
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
            return await handleMethod(
              { hono: c, ...(options.context ?? {}) },
              meta,
              handlerData
            );
          } catch (e) {
            if (isBeffHttpException(e)) {
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
  return app;
}

export const buildHonoTestClient = <T>(options: {
  generated: {
    meta: HandlerMetaClient[];
  };
  app: Hono<any, any, any>;
  env?: any;
  executionContext?: any;
  baseUrl?: string;
}): ClientFromRouter<T> => {
  const { baseUrl, generated, app, env, executionContext } = options;
  return buildClient<T>({
    baseUrl: baseUrl ?? "http://localhost",
    generated: generated,
    fetchFn: async (req: any) =>
      await app.fetch(req as any, env, executionContext),
  });
};
