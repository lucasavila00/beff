type B = { c: string };
type A = {
  a: B;
};

export default {
  [`/hello/{id}`]: { get: async (id: A): Promise<string> => `Hello ${id}!` },
};
