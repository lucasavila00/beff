export default {
  [`/hello3`]: {
    get: function (): Promise<string> {
      return Promise.resolve("Hello!");
    },
  },
};
