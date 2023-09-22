import router from "@/beff/router";
import { buildHonoApp, buildHonoTestClient } from "@beff/hono";
import generated from "@/beff/generated/router";

export const routerApp = buildHonoApp({
  router,
  generated,
  servers: [
    {
      url: "/api/beff",
    },
  ],
});

export const beffServerClient = buildHonoTestClient<typeof router>({
  generated,
  app: routerApp,
});
