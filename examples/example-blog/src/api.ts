import { Hono } from "hono";
import { Bindings } from "./bindings";
import { buildHonoApp } from "@beff/hono";
import router from "./router";
import * as generated from "./gen/router";

const app = buildHonoApp({
  generated,
  router,
  openApi: {
    servers: [
      {
        url: "/api",
      },
    ],
  },
});
export { app as api };
