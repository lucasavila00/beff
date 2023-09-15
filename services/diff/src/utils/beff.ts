import type AppRouter from "../../functions/api/router";
import { buildReactQueryClient } from "@beff/react";
import generated from "../../functions/api/generated/client";

export const beff = buildReactQueryClient<typeof AppRouter>({
  generated,
  baseUrl: "http://localhost:8788/api",
});
