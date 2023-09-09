type AllTypes = {
  null: null;
  undefined: undefined;
  any: any;
  unknown: unknown;
  allStrings: string;
  allNumbers: number;
  allBooleans: boolean;
  arrayOfStrings: string[];
  typeReference: User;
  interface: Post;
  optionalType?: number[];
  tuple: [string, string];
  tupleWithRest: [string, string, ...number[]];
  stringLiteral: "a";
  numberLiteral: 123;
  booleanLiteral: true;
  unionOfTypes: string | number;
  unionOfLiterals: "a" | "b" | "c";
  unionWithNull: User[] | number | null;
  intersection: { a: 1 } & { b: 2 };
};

// recursive types can be serialized and validated
type User = {
  id: string;
  friends: User[];
};

interface Post {
  id: string;
  content: string;
}

export default {
  "/all-types": {
    get: (): AllTypes => {
      throw new Error("Not implemented");
    },
  },
};
