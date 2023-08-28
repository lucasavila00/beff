import { GET, todo } from "bff";

type A<X> = [X, X];
namespace Y {
  export type B = [string, string];
}
export default {
  [`/user`]: async (...q: string[]): Promise<string> => {
    return todo();
  },
  [`/user1`]: async (...q: A<string>): Promise<string> => {
    return todo();
  },
  [`/user2`]: async (...q: Y.B): Promise<string> => {
    return todo();
  },
};
