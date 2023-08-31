import { Header, Cookie, todo } from "./bff-generated";
import { UserEntity } from "./types";

type DataTypesKitchenSink = {
  basic: {
    a: string;
    b: number;
    c: boolean;
  };
  array1: string[];
  array2: Array<string>;
  tuple1: [string];
  tuple2: [string, string];
  tuple_rest: [string, string, ...number[]];
  nullable: string | null;
  many_nullable: number | string | null;
  optional_prop?: string;
  union_with_undefined: string | undefined;
  union_of_many: string | number | boolean;
  literals: {
    a: "a";
    b: 1;
    c: true;
  };
  enum: "a" | "b" | "c";
  tuple_lit: ["a", 1, true];
  str_template: `ab`;
};

type Cb = (err: Error | null, result?: string) => void;

type User = {
  id: number;
  name: string;
  entities: UserEntity[];
  optional_prop?: string;
};
type Ctx = any;

/**
 * Optional multiline or single-line description in [CommonMark](http://commonmark.org/help/) or HTML.
 *
 * @title Sample API
 * @version 0.1.9
 */
export default {
  [`/data-types-kitchen-sink`]: {
    get: async (): Promise<DataTypesKitchenSink> => todo(),
  },
  [`/anon-func`]: {
    get: async function (): Promise<string> {
      return todo();
    },
  },
  /**
   * Optional extended description in CommonMark or HTML.
   *
   * @summary Returns a list of users.
   */
  [`/users`]: {
    get: async (
      c: Ctx,
      user_agent: Header<string>,
      ads_id: Cookie<string>
    ): Promise<string[]> => [],
  },

  /**
   * Optional extended description in CommonMark or HTML...
   *
   * @summary Returns the user.
   */
  [`/users/{id}`]: {
    get: async (
      c: Ctx,
      /**
       * The user id.
       */
      id: number
    ): Promise<User> => ({
      id,
      name: "John Doe",
      entities: [],
    }),
  },
  ["/users2/{id}"]: {
    get: async (c: Ctx, id: string): Promise<string> => todo(),
    post: async (c: Ctx, id: string): Promise<string> => todo(),
  },
  ["/users3"]: {
    get: async (): Promise<string> => todo(),
  },
  ["/users4"]: {
    get: async (): Promise<string> => todo(),
    post: async (): Promise<string> => todo(),
  },
};
