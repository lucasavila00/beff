export const router5 = {
  router5Nested: {
    [`/hello5`]: { get: (): string => "Hello!" },
  },
};

export type Router6 = typeof router5;
