export default {
  "/a": {
    get: async (): Promise<{ a: string } & { a: number }> => {
      throw new Error("This is an error");
    },
  },
  "/b": {
    get: async (): Promise<string & number> => {
      throw new Error("This is an error");
    },
  },
};
