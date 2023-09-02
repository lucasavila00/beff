import * as T from "./types";

const todo = () => {
  throw new Error("TODO");
};
export default {
  ["/abc"]: {
    get: async (): Promise<T.X.UserEntity> => todo(),
    post: async (): Promise<T.Abc> => todo(),
  },
};
