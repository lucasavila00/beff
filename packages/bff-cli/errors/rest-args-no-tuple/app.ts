type A<X> = [X, X];
namespace Y {
  export type B = [string, string];
}
export default {
  [`GET/user`]: async (...q: string[]): Promise<string> => {
    return todo();
  },
  [`GET/user1`]: async (...q: A<string>): Promise<string> => {
    return todo();
  },
  [`GET/user2`]: async (...q: Y.B): Promise<string> => {
    return todo();
  },
};
