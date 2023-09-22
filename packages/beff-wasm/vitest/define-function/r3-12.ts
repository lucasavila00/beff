type A = string;
export default {
  [`/hello3`]: {
    get: function (): Promise<A> {
      return Promise.resolve("Hello!");
    },
  },
};
