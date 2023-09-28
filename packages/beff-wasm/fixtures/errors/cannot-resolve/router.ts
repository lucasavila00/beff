import * as D from "./abc";
import E from "./def";

export default {
  [`/hello`]: {
    get: async (): Promise<ThisDoesNotExist> => {
      return "test";
    },
  },
  "/a2": {
    get: (): D => {
      return "";
    },
  },
  "/a3": {
    get: (): E => {
      return "";
    },
  },
};
