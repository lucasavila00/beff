import { Hono } from "hono";
import { registerRouter } from "./bff-generated";
import router from "./router";
import { handle } from "hono/cloudflare-pages";

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
});

export const onRequest = handle(app);
