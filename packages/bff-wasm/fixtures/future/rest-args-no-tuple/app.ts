type A<X> = [X, X];
namespace Y {
  export type B = [string, string];
}
export default {
  [`/user`]: {
    get: async (...q: string[]): Promise<string> => {
      return todo();
    },
  },
  [`/user1`]: {
    get: async (...q: A<string>): Promise<string> => {
      return todo();
    },
  },
  [`/user2`]: {
    get: async (...q: Y.B): Promise<string> => {
      return todo();
    },
  },
};
