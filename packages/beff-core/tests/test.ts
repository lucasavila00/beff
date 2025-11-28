type A = { a: string };
type R = Record<string, string>;

const receivesA = (arg: A) => {};
const receivesR = (arg: R) => {};

const a: A = { a: "hello" };
const r: R = { a: "hello", b: "world" };

receivesA(a); // OK
receivesA(r); // OK

type X1 = A extends R ? true : false; // true
type X2 = R extends A ? true : false; // false
