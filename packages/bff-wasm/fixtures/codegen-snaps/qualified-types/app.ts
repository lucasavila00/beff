import _2, * as T from "./types";
import _, { Abc as Def } from "./types";
import { TYX as LOL } from "./t3";

const todo = () => {
  throw new Error("TODO");
};
export default {
  ["/abc"]: {
    get: async (): Promise<T.X.UserEntity> => todo(),
    post: async (): Promise<T.Abc> => todo(),
    put: async (): Promise<Def> => todo(),
    delete: async (): Promise<LOL.XYZ> => todo(),
  },
};
