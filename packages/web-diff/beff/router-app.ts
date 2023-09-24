import router from "@/beff/router";
import { buildHonoApp, buildHonoLocalClient } from "@beff/hono";
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

export const beffLocalClient = buildHonoLocalClient<typeof router>({
  generated,
  app: routerApp,
});
