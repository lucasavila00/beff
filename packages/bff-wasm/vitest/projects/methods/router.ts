export default {
  [`/hello`]: {
    get: async (): Promise<string> => {
      return "Hello!";
    },
    post: async (): Promise<string> => {
      return "Hello!";
    },
    put: async (): Promise<string> => {
      return "Hello!";
    },
    delete: async (): Promise<string> => {
      return "Hello!";
    },
    patch: async (): Promise<string> => {
      return "Hello!";
    },
    options: async (): Promise<string> => {
      return "Hello!";
    },
  },
};
