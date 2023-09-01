import type { Context, Hono } from "hono";
import {
  BffHTTPException,
  coerce,
  decodeNoMessage,
  decodeWithMessage,
  template,
} from "./runtime";
import { HandlerMeta, MetaParam, OpenApiServer } from "./types";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { ClientFromRouter } from "./client-def";
import { buildStableClient } from "./client-impl";

const toHonoPattern = (pattern: string): string => {
  // replace {id} with :id
  return pattern.replace(/\{(\w+)\}/g, ":$1");
};
declare const meta: any;

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
      case "context": {
        return c;
      }
    }
    throw new Error("not implemented: " + p.type);
  });
  const resolverParams = await Promise.all(resolverParamsPromise);
  const result = await handler(...resolverParams);
  return c.json(decodeNoMessage(meta.return_validator, result));
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
}) {
  registerDocs(options.app, meta, options.openApi?.servers ?? []);
  const handlersMeta: HandlerMeta[] = meta["handlersMeta"];
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
            return await handleMethod(c, meta, handlerData);
          } catch (e) {
            if (e instanceof BffHTTPException) {
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
  app: Hono<any, any, any>,
  env?: any,
  executionContext?: any
): ClientFromRouter<T> =>
  buildStableClient<T>(async (req) => {
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
