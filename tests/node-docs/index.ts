import { serve } from "@hono/node-server";
import { buildHonoApp } from "@beff/hono";
import router from "./router";
import generated from "./generated/router";

export const app = buildHonoApp({
  router,
  generated,
});
serve({
  fetch: app.fetch,
  port: 3040,
});

console.log(`Server running at http://localhost:3040/`);
console.log(`Check docs at at http://localhost:3040/docs`);
