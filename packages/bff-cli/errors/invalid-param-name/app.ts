import { GET } from "bff";

export default {
  [GET`/hello/{ida}`]: async (id: string): Promise<string> => `Hello ${id}!`,
};
