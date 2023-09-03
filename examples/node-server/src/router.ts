import { Ctx } from "@beff/hono";

type HelloResponse = {
  message: string;
};
export default {
  [`/`]: { get: async (c: Ctx): Promise<string> => "ok" },
  [`/hello/{name}`]: {
    get: async (c: Ctx, name: string): Promise<HelloResponse> => {
      return {
        message: `Hello ${name}!`,
      };
    },
  },
};
