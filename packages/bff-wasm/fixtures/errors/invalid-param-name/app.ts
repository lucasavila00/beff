import { GET } from "bff";

export default {
  [`/hello/{ida}`]: {
    get: async (id: string): Promise<string> => `Hello ${id}!`,
  },
};
