import { GET, POST, PUT, DELETE, PATCH, OPTIONS } from "./bff-generated";
export default {
  [GET`/hello`]: async (): Promise<string> => {
    return "Hello!";
  },
  [POST`/hello`]: async (): Promise<string> => {
    return "Hello!";
  },
  [PUT`/hello`]: async (): Promise<string> => {
    return "Hello!";
  },
  [DELETE`/hello`]: async (): Promise<string> => {
    return "Hello!";
  },
  [PATCH`/hello`]: async (): Promise<string> => {
    return "Hello!";
  },
  [OPTIONS`/hello`]: async (): Promise<string> => {
    return "Hello!";
  },
};
