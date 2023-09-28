import * as D from "./abc";
import E from "./def";
import { router5 } from "./r5";

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
  ...router5.router5Nested,
};
