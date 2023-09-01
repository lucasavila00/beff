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
  [`/hello1`]: { get: async (): Promise<Newable> => todo() },
  [`/hello2`]: { get: async (): Promise<B> => todo() },
  [`/hello3`]: { get: async (): Promise<D> => todo() },
  [`/hello4`]: { get: async (): Promise<E> => todo() },
  [`/hello5`]: { get: async (): Promise<() => void> => todo() },
  [`/hello6`]: { get: async (): Promise<typeof f> => todo() },
  [`/hello7`]: { get: async (): Promise<B["b"]> => todo() },
  [`/hello8`]: { get: async (): Promise<never> => todo() },
  [`/hello9`]: { get: async (): Promise<symbol> => todo() },
  [`/hello10`]: { get: async (): Promise<void> => todo() },
};
