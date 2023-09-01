export type NormalizeRouterItem<T> = T extends (
  ...args: infer I
) => Promise<infer O>
  ? [I, O]
  : T extends (...args: infer I) => infer O
  ? [I, O]
  : never;
type RemoveFirstOfTuple<T extends any[]> = T["length"] extends 0
  ? []
  : T extends [any, ...infer U]
  ? U
  : T;
export type SimpleHttpFunction<M extends [any[], any]> = (
  ...args: RemoveFirstOfTuple<M[0]>
) => Promise<M[1]>;

export type ClientFromRouter<R> = {
  [K in keyof R as K extends `${string}*${string}` ? never : K]: {
    [M in keyof R[K] as M extends `use` ? never : M]: SimpleHttpFunction<
      NormalizeRouterItem<R[K][M]>
    >;
  };
};
