import { GET, todo } from "bff";

type A<X> = [X, X];
namespace Y {
  export type B = [string, string];
}
export default {
  [GET`/user`]: async (...q: string[]): Promise<string> => {
    return todo();
  },
  [GET`/user`]: async (...q: A<string>): Promise<string> => {
    return todo();
  },
  [GET`/user`]: async (...q: Y.B): Promise<string> => {
    return todo();
  },
};
