// A
export default {
  // B
  [`/hello`]: {
    // C
    get: async (): Promise<ThisDoesNotExist> => {
      // D
      return "test";
    },
  },
};
