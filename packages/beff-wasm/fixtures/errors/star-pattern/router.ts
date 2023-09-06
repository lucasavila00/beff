export default {
  [`/hello/*`]: {
    get: async (): Promise<string> => {
      return "test";
    },
  },
};
