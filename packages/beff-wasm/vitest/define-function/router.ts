import { r0 } from "./r0";
import r3 from "./r3";

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
  ...r3,
  [`/hello4`]: {
    get: function (): string {
      return "Hello!";
    },
  },
  [`/hello5`]: { get: (): string => "Hello!" },
};

export default r;
