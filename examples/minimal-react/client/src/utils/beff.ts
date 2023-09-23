import type { AppRouter } from "../../../server";
import { buildReactQueryClient } from "@beff/react";
import generated from "../../../server/generated/router";
export const beff = buildReactQueryClient<AppRouter>({
  generated,
  baseUrl: "http://localhost:2022",
});
