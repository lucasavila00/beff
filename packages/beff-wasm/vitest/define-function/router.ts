import { r0 } from "./r0";
import r3 from "./r3";
import * as allOfR4 from "./r4";

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
  ...allOfR4.r4,
  [`/hello5`]: { get: (): string => "Hello!" },
};

export default r;
