import parse from "./bff-generated/parser";

// With codegen.maxValidateFunctionSize = 100, Small gets a generated validate function and Big does not.
type Small = { a: string };
type Big = { b: number; small: Small; list: { c: boolean }[] };

export const { Small, Big } = parse.buildParsers<{ Small: Small; Big: Big }>();
