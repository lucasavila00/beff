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
export default {
  [`/hello/{id}`]: { get: async (c: Ctx, id: string): Promise<A2> => todo() },
};
