import * as T1 from "./t1";
const todo = () => {
  throw new Error("TODO");
};
export default {
  [`/abc`]: { get: async (): Promise<{ a: T1.Param }> => todo() },
};
