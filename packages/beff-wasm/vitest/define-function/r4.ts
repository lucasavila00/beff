export const r4 = {
  [`/hello4`]: {
    get: function (): string {
      return "Hello!";
    },
  },
};
import * as r3 from "./r3";
export { r3 };

export { r3 as default };

export type A = {
  a: string;
  b: string;
};
