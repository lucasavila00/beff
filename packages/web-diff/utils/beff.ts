import type AppRouter from "@/app/api/beff/[...beff]/router";
import { buildReactQueryClient } from "@beff/react";
import generated from "@/app/api/beff/[...beff]/generated/client";

export const beff = buildReactQueryClient<typeof AppRouter>({
  generated,
  baseUrl: "/api/beff",
});
