import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import router from "./router";
import generated from "./generated/router";
import { buildHonoApp } from "@beff/hono";

const routerApp = buildHonoApp({
  router,
  generated,
  servers: [
    {
      url: "/api",
    },
  ],
});

const app = new Hono().basePath("/api");

app.route("/", routerApp);

export const onRequest = handle(app);
