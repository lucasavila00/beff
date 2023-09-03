import { buildHonoApp } from "@beff/hono";
import router from "./router";
import generated from "./gen/router";

export const api = buildHonoApp({
  generated,
  router,
  servers: [
    {
      url: "/api",
    },
  ],
});
