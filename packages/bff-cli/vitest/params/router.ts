import { Cookie, Header } from "./bff-generated";
import { cors } from "hono/cors";
export default {
  ["/*"]: {
    use: [cors()],
  },
  ["/hello"]: {
    get: async (): Promise<string> => {
      return "Hello!";
    },
    post: async (): Promise<string> => {
      return "Hello!";
    },
  },
  ["/path-param/{name}"]: {
    get: async (name: string): Promise<string> => {
      return name;
    },
    post: async (name: string): Promise<string> => {
      return name;
    },
  },
  ["/query-param"]: {
    get: async (limit: number): Promise<number> => {
      return limit;
    },
  },
  ["/header-param"]: {
    get: async (user_agent: Header<string>): Promise<string> => {
      return user_agent;
    },
  },
  ["/cookie-param"]: {
    get: async (ads_ids: Cookie<string>): Promise<string> => {
      return ads_ids;
    },
  },
  ["/req-body"]: {
    post: async (data: { a: string }): Promise<string> => {
      return data.a;
    },
  },
  ["/path-param-string/{name}"]: {
    get: async (name: string): Promise<string> => {
      return name;
    },
  },
  ["/path-param-number/{id}"]: {
    get: async (id: number): Promise<number> => {
      return id;
    },
  },
  ["/path-param-boolean/{flag}"]: {
    get: async (flag: boolean): Promise<boolean> => {
      return flag;
    },
  },
  ["/path-param-union/{id}"]: {
    get: async (id: ValidIds): Promise<ValidIds> => {
      return id;
    },
  },
};
type ValidIds = 123 | 456;
