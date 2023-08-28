import { Cookie, GET, Header, POST } from "./bff-generated";
export default {
  [GET`/hello`]: async (): Promise<string> => {
    return "Hello!";
  },
  [GET`/path-param/{name}`]: async (name: string): Promise<string> => {
    return name;
  },
  [GET`/query-param`]: async (limit: number): Promise<number> => {
    return limit;
  },
  [GET`/header-param`]: async (user_agent: Header<string>): Promise<string> => {
    return user_agent;
  },
  [GET`/cookie-param`]: async (ads_ids: Cookie<string>): Promise<string> => {
    return ads_ids;
  },

  // POST
  [POST`/hello`]: async (): Promise<string> => {
    return "Hello!";
  },
  [POST`/path-param/{name}`]: async (name: string): Promise<string> => {
    return name;
  },
  [POST`/req-body`]: async (data: { a: string }): Promise<string> => {
    return data.a;
  },
};
