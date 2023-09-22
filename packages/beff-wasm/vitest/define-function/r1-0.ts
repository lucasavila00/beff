import { r0 } from "./r0";

export default {
  ...r0,
  [`/hello2`]: {
    get: async function (): Promise<string> {
      return "Hello!";
    },
  },
};
