import { Ctx } from "@beff/hono";

type RootResponse = { Hello: string };
type ItemsResponse = { item_id: string; q?: string };

export default {
  "/": {
    get: async (): Promise<RootResponse> => {
      return { Hello: "World" };
    },
  },
  "/items/{item_id}": {
    get: (c: Ctx, item_id: string, q?: string): ItemsResponse => {
      return { item_id, q };
    },
  },
};
