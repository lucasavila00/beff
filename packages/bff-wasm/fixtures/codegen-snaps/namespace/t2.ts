export namespace Y {
  export type B = number;
}
const x = ["a", "b", "c"] as const;
type X = (typeof x)[number];
