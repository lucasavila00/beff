import type { AppRouter } from "../../../server";
import { buildReactQueryClient } from "@beff/react";
import generated from "../../../server/generated/client";
export const beff = buildReactQueryClient<AppRouter>({
  generated,
  baseUrl: "http://localhost:2022",
});
