import { Hono } from "hono";
import { registerRouter } from "@beff/hono";
import router from "./router";
import { handle } from "hono/cloudflare-pages";
import { meta, schema } from "./bff-generated";

export const app = new Hono().basePath("/api");

registerRouter({
  app,
  router,
  openApi: {
    servers: [
      {
        url: "/api",
      },
    ],
  },
  meta,
  schema,
});

export const onRequest = handle(app);
