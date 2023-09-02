import { Hono } from "hono";
import { Bindings } from "./bindings";
import { registerRouter } from "bff-hono";
import router from "./router";
import { meta, schema } from "./gen";

const api = new Hono<{ Bindings: Bindings }>();
registerRouter({
  meta,
  schema,
  app: api,
  router,
  openApi: {
    servers: [
      {
        url: "/api",
      },
    ],
  },
});
export { api };
