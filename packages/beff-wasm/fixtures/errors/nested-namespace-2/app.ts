import { Ctx } from "@beff/hono";
const todo = () => {
  throw new Error("TODO");
};
export namespace SomeNamespace2 {
  export namespace Nested {
    export type SomeType3 = {
      id: string;
    };
  }
  export type SomeType2 = Nested.SomeType3;
}

export default {
  [`/hello2`]: {
    get: async (c: Ctx): Promise<SomeNamespace2.SomeType2> => todo(),
  },
};
