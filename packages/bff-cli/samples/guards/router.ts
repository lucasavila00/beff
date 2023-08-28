import { GET, USE } from "./bff-generated";
import { Context as HonoContext } from "hono/context";
import { cors } from "hono/cors";
import { User } from "./types.js";

type Context = HonoContext<{
  Variables: {
    message: string;
  };
}>;

export default {
  [USE`/*`]: cors(),
  [GET`/user/{name}`]: async (c: Context, name: string): Promise<User> => {
    const message = c.get("message");
    return { name: message };
  },
};
