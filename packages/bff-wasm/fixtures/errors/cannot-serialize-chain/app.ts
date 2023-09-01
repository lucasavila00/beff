const todo = () => {
  throw new Error("Not implemented");
};
type Ctx = unknown;

type A = {
  a: () => void;
};
type A2 = {
  a: A;
};
type A3 = {
  a: A2;
};
export default {
  [`/hello/{id}`]: { get: async (c: Ctx, id: string): Promise<A3> => todo() },
};
