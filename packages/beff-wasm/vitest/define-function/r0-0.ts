type B = string;

export const r0 = {
  [`/hello1`]: {
    get: async (): Promise<B> => {
      return "Hello!";
    },
  },
};
