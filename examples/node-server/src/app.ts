import { buildHonoApp } from "@beff/hono";
import router from "./router";
import generated from "./generated/router";
import { serve } from "@hono/node-server";

const app = buildHonoApp({
  router,
  generated,
});

serve(app);

console.log(`Server running at http://localhost:3000/`);
