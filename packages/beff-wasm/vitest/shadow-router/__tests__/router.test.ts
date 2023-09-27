import { test, expect } from "vitest";
import { buildHonoApp, buildHonoLocalClient } from "@beff/hono";
import router from "../router";
import generated from "../bff-generated/router";
import generatedClient from "../bff-generated/router";

const app = buildHonoApp({ router, generated });
const beff = buildHonoLocalClient<typeof router>({
  generated: generatedClient,
  app,
});

test("a", async () => {
  await expect(beff["/a"].post()).resolves.toBe("a");
  await expect(beff["/a/b"].post()).resolves.toBe("b");
  await expect(beff["/c"].post()).resolves.toBe("c");
  await expect(beff["/c/d"].post()).resolves.toBe("d");
});

test("aa", async () => {
  await expect(beff["/aa/{rest}"].post("rr")).resolves.toBe("aarr");
  await expect(beff["/aa/bb"].post()).resolves.toBe("bb");
  await expect(beff["/cc/{rest}"].post("rr")).resolves.toBe("ccrr");
  await expect(beff["/cc/dd"].post()).resolves.toBe("dd");
});
