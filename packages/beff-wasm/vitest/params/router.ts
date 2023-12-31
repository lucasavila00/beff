import { Header } from "@beff/cli";
import { Ctx } from "@beff/hono";
import { cors } from "hono/cors";

type N1 = number;
type N2 = N1;

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
    get: async (_c: Ctx, name: string): Promise<string> => {
      return name;
    },
    post: async (_c: Ctx, name: string): Promise<string> => {
      return name;
    },
  },
  ["/query-param"]: {
    get: async (_c: Ctx, limit: N2, _optional?: string): Promise<number> => {
      return limit;
    },
  },
  ["/header-param"]: {
    get: async (_c: Ctx, user_agent: Header<string>): Promise<string> => {
      return user_agent;
    },
  },
  ["/req-body"]: {
    post: async (_c: Ctx, data: { a: string }): Promise<string> => {
      return data.a;
    },
  },
  ["/path-param-string/{name}"]: {
    get: async (_c: Ctx, name: string): Promise<string> => {
      return name;
    },
  },
  ["/path-param-number/{id}"]: {
    get: async (_c: Ctx, id: number): Promise<number> => {
      return id;
    },
  },
  ["/path-param-boolean/{flag}"]: {
    get: async (_c: Ctx, flag: boolean): Promise<boolean> => {
      return flag;
    },
  },
  ["/path-param-union/{id}"]: {
    get: async (_c: Ctx, id: ValidIds): Promise<ValidIds> => {
      return id;
    },
  },
  "/with-default": {
    get: async (_c: Ctx, page: number = 1): Promise<number> => {
      return page;
    },
    post: async (_c: Ctx, page: number | undefined = 1): Promise<number> => {
      return page;
    },
  },
};
type ValidIds = 123 | 456;
