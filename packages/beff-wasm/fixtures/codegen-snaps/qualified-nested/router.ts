import * as Models from "./models";
export default {
  [`/a`]: {
    get: async (): Promise<Models.Main.User> => {
      throw new Error("TODO");
    },
  },
};
