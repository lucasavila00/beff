export default {
  [`/hello1`]: {
    get: async (): Promise<string> => {
      return "Hello!";
    },
  },
  [`/hello2`]: {
    get: async function (): Promise<string> {
      return "Hello!";
    },
  },
  [`/hello3`]: {
    geT: function (): Promise<string> {
      return Promise.resolve("Hello!");
    },
  },
  [`/hello4`]: {
    GeT: function (): string {
      return "Hello!";
    },
  },
  [`/hello5`]: { GET: (): string => "Hello!" },
};
