import router from "@/beff/router";
import { buildHonoApp, buildHonoTestClient } from "@beff/hono";
import generated from "@/beff/generated/router";
import { Hono } from "hono";

const routerApp = buildHonoApp({
  router,
  generated,
  servers: [
    {
      url: "/api/beff",
    },
  ],
});

const app = new Hono().basePath("/api/beff");

app.route("/", routerApp);

const handler = (request: Request) => app.fetch(request);

export const beffServerClient = buildHonoTestClient<typeof router>({
  generated,
  app: routerApp,
});

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
  handler as OPTIONS,
};
