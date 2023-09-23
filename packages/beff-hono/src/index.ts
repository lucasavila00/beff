import { Hono } from "hono";
import {
  HandlerMetaServer,
  MetaParamServer,
  OpenAPIDocument,
  OpenApiServer,
} from "@beff/cli";
import { ClientFromRouter, buildClient, printErrors } from "@beff/client";
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

const decodeWithMessage = (
  validator: any,
  value: any,
  parentPath: string[]
) => {
  const validatorCtx: any = {};

  const newValue = validator(validatorCtx, value);
  const errors = validatorCtx.errors;
  if (errors?.length > 0) {
    throw new BffHTTPException(422, printErrors(errors, parentPath));
  }
  return newValue;
};
const decodeNoMessage = (validator: any, value: any) => {
  const validatorCtx: any = {};
  const newValue = validator(validatorCtx, value);
  const errors = validatorCtx.errors;
  if (errors?.length > 0) {
    throw new BffHTTPException(500, "Internal error");
  }
  return newValue;
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
          return decodeWithMessage(p.validator, value, [p.name]);
        }
        case "query": {
          const value = c.hono.req.query(p.name);
          return decodeWithMessage(p.validator, value, [p.name]);
        }
        case "header": {
          const value = c.hono.req.header(p.name);
          return decodeWithMessage(p.validator, value, [p.name]);
        }
        case "body": {
          const value = await c.hono.req.json();
          return decodeWithMessage(p.validator, value, [p.name]);
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

  const resValidated = decodeNoMessage(meta.return_validator, result);
  const resEncoded = meta.return_encoder(resValidated);
  return c.hono.json(resEncoded);
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

const lowerCaseRouter = (it: Record<string, Record<string, any>>) => {
  const lowerCaseRouter: Record<string, Record<string, any>> = {};
  for (const path in it) {
    const methodsAcc: any = {};
    for (const method in it[path]) {
      methodsAcc[method.toLowerCase()] = it[path][method];
    }
    lowerCaseRouter[path] = methodsAcc;
  }
  return lowerCaseRouter;
};

export function buildHonoApp(options: {
  router: Record<string, Record<string, any>>;
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
    const routers = lowerCaseRouter(options.router);
    const handlerData = routers[meta.pattern][meta.method_kind.toLowerCase()];
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
    meta: HandlerMetaServer[];
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
