const d = {};
export default {
  [`GET/hello/{id}`]: async (id: string) => id,
  a: 1,
  b() {
    return 1;
  },
  get c() {
    return 1;
  },
  set c(v) {},
  [`AAAAAAAAAAAAAAAAAAGETOOOO/hello/{id}`]: async (
    id: string
  ): Promise<string> => id,
  [`GETOOOO/hello/{id}`]: async (id: string): Promise<string> => id,
  ...d,
};
