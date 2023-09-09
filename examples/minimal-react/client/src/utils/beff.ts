import type { AppRouter } from "../../../server";
import { buildReactQueryClient } from "@beff/react";
// import { buildClient } from "@beff/client";
import generated from "../../../server/generated/client";

// const fetchClient = buildClient<AppRouter>({
//   generated,
//   baseUrl: "http://localhost:2022",
// });

export const beff = buildReactQueryClient<AppRouter>({
  generated,
  baseUrl: "http://localhost:2022",
});
