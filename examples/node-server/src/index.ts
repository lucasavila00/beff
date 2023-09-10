import { serve } from "@hono/node-server";
import { buildHonoApp } from "@beff/hono";
import router from "./router";
import generated from "./generated/router";

serve(
  buildHonoApp({
    router,
    generated,
  })
);

console.log(`Server running at http://localhost:3000/`);
console.log(`Serving docs at http://localhost:3000/docs`);
