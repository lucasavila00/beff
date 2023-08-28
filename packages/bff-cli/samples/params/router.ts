import { Cookie, GET, Header } from "./bff-generated";
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
};
