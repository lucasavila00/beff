const todo = () => {
  throw new Error("Not implemented");
};
type Ctx = unknown;

export default {
  [`/hello/{id}`]: {
    get: async (id: string, c: Ctx): Promise<string> => todo(),
  },
};
