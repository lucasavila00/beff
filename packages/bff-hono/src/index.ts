import type { Hono } from "hono";
import { HandlerMeta, MetaParam, OpenApiServer } from "bff-types";
import {
  BffHTTPException,
  decodeNoMessage,
  decodeWithMessage,
  template,
} from "bff-server";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { buildStableClient, ClientFromRouter } from "bff-client";
import type { Ctx } from "bff";

const coerce = (coercer: any, value: any): any => {
  return coercer(value);
};

const toHonoPattern = (pattern: string): string => {
  // replace {id} with :id
  return pattern.replace(/\{(\w+)\}/g, ":$1");
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
const isBffHTTPException = (it: unknown): it is BffHTTPException =>
  (it as any)?.__isBffHTTPException ?? false;
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
            if (isBffHTTPException(e)) {
              throw new HTTPException(e.status, {
                message: e.message,
              });
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
    throw await r.text();
  });
