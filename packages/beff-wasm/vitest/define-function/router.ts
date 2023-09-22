const r0 = {
  [`/hello1`]: {
    get: async (): Promise<string> => {
      return "Hello!";
    },
  },
};
const r = {
  ...r0,
  [`/hello2`]: {
    get: async function (): Promise<string> {
      return "Hello!";
    },
  },
  [`/hello3`]: {
    get: function (): Promise<string> {
      return Promise.resolve("Hello!");
    },
  },
  [`/hello4`]: {
    get: function (): string {
      return "Hello!";
    },
  },
  [`/hello5`]: { get: (): string => "Hello!" },
};

export default r;
