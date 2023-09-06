export default {
  [`/hello/{a}b`]: {
    get: async (): Promise<string> => {
      return "test";
    },
  },
  [`/hello/b{a}`]: {
    get: async (): Promise<string> => {
      return "test";
    },
  },
  [`/hello/{a*}`]: {
    get: async (): Promise<string> => {
      return "test";
    },
  },
};
