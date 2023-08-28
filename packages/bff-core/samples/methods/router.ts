import { GET } from "./bff-generated";
export default {
  [GET`/{name}`]: async (name: string): Promise<string> => {
    return name;
  },
};
