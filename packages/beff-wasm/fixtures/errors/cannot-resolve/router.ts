export default {
  [`/hello`]: {
    get: async (): Promise<ThisDoesNotExist> => {
      return "test";
    },
  },
};
