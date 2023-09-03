type B = { c: string };
type A = {
  a: B;
};
type Ctx = any;

export default {
  [`/hello/{id}`]: {
    get: async (ctx: Ctx, id: A): Promise<string> => `Hello ${id}!`,
  },
};
