import type AppRouter from "@/beff/router";
import { buildReactQueryClient } from "@beff/react";
import generated from "@/beff/generated/router";

export const beff = buildReactQueryClient<typeof AppRouter>({
  generated,
  baseUrl: "/api/beff",
});
