import { GET } from "bff";

export default {
  [`/hello/{ida}`]: {
    get: async (c: Ctx, id: string): Promise<string> => `Hello ${id}!`,
  },
};
