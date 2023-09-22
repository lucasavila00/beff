import { r0 } from "./r0";

const r1 = {
  ...r0,
  [`/hello2`]: {
    get: async function (): Promise<string> {
      return "Hello!";
    },
  },
};
const r = {
  ...r1,
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
