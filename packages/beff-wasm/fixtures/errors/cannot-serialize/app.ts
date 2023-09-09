const todo = () => {
  throw new Error("Not implemented");
};
interface Newable {
  errorConstructor: new (...args: any) => Error;
}
interface B {
  b: this;
}
type D = true extends true ? true : true;
type E = true extends infer X ? X : never;

const f = 1;
export default {
  [`/bad1`]: { get: (): Newable => todo() },
  [`/bad2`]: { get: (): B => todo() },
  [`/bad3`]: { get: (): D => todo() },
  [`/bad4`]: { get: (): E => todo() },
  [`/bad5`]: { get: (): (() => void) => todo() },
  [`/bad6`]: { get: (): typeof f => todo() },
  [`/bad7`]: { get: (): B["b"] => todo() },
  [`/bad8`]: { get: (): never => todo() },
  [`/bad9`]: { get: (): symbol => todo() },
  [`/bad10`]: { get: (): void => todo() },
};
