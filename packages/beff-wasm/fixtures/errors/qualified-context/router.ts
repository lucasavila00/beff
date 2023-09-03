import * as T1 from "./t1";
const todo = () => {
  throw new Error("TODO");
};
export default {
  [`/abc`]: { get: async (): Promise<T1.Param> => todo() },
};
