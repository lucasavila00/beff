import { buildHonoApp } from "@beff/hono";
import router from "./beff/router";
import generated from "./beff/generated/router";

const app = buildHonoApp({
	router,
	generated,
});

export default app;
