import { cors } from "hono/cors";
import { Context as HonoContext } from "hono";

const todo = () => {
  throw new Error("TODO");
};
type Context = HonoContext<{}>;
export default {
  ["/posts/*"]: { use: [cors()] },
  ["/"]: {
    get: async (): Promise<{ message: string }> => {
      return { message: "Hello" };
    },
  },
  ["/posts"]: {
    get: async (c: Context): Promise<{ posts: any[]; ok: boolean }> => todo(),
  },
};
