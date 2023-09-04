import { serve } from "@hono/node-server";
import { buildHonoApp } from "@beff/hono";
import router from "./router";
import generated from "./generated/router";

const app = buildHonoApp({
  router,
  generated,
});

export type AppRouter = typeof router;

serve({
  fetch: app.fetch,
  port: 2022,
});
console.log(`Server running at http://localhost:2022/`);
