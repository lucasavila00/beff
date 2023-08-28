import { GET, todo } from "bff";
interface Newable {
  errorConstructor: new (...args: any) => Error; // <- put here whatever Base Class you want
}
interface B {
  b: this;
}
type D = true extends true ? true : true;
type E = true extends infer A ? true : A;
const f = 1;
type A = {
  a: () => void;
  b: B;
  c: Newable;
  d: D;
  e: E;
  f: typeof f;
  g: B["b"];
  h: never;
  i: symbol;
  j: void;
};

export default {
  [`GET/hello/{id}`]: async (id: string): Promise<A> => todo(),
};
