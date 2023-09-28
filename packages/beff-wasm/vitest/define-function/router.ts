import { r0 } from "./r0";
import r3 from "./r3";
import * as allOfR4 from "./r4";
import { router5 } from "./r5";

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
  ...router5.router5Nested,
  [`/hello100`]: { get: (): string => "Hello!" },
};

export default r;
