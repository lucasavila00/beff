import { Hono } from "hono";
import { Bindings } from "./bindings";
import { registerRouter } from "./gen";
import router from "./router";

const api = new Hono<{ Bindings: Bindings }>();
registerRouter({
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
