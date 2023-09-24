const d = {};
export default {
  ["asd"]: {
    [`GET/hello/{id}`]: async (id: string) => id,
    a: 1,
    b() {
      return 1;
    },
    get c() {
      return 1;
    },
    set c(v) {},
    [`AAAAAAAAAAAAAAAAAAGETOOOO/hello/{id}`]: async (id: string): Promise<string> => id,
    [`GETOOOO/hello/{id}`]: async (id: string): Promise<string> => id,
    ...d,
    [`GET/hello2/{id}`]: async function* (id: string): Promise<string> {
      return id;
    },
    [`GET/hello3/{id}`]: <T>(id: string): string => id,
    [`GET/hello4/{id}`]: async <T>(id: string): Promise<string> => id,
    [`GET/hello5/{id}`]: async <T>(id: T): Promise<T> => id,
  },
  [`GET/hello/{id}`]: async (id: string) => id,
  a: 1,
  b() {
    return 1;
  },
  get c() {
    return 1;
  },
  set c(v) {},
  [`AAAAAAAAAAAAAAAAAAGETOOOO/hello/{id}`]: async (id: string): Promise<string> => id,
  [`GETOOOO/hello/{id}`]: async (id: string): Promise<string> => id,
  ...d,
  [`GET/hello2/{id}`]: async function* (id: string): Promise<string> {
    return id;
  },
  [`GET/hello3/{id}`]: <T>(id: string): string => id,
  [`GET/hello4/{id}`]: async <T>(id: string): Promise<string> => id,
  [`GET/hello5/{id}`]: async <T>(id: T): Promise<T> => id,
};
