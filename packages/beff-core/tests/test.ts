type A = Record<"a" | "b", string>;

type B = Record<string, string>;

type R1 = A extends B ? true : false; // true
type R2 = B extends A ? true : false; // false
