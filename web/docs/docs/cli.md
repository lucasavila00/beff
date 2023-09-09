---
sidebar_position: 2
---

# @beff/cli

Use the CLI to generate the code needed to run routers and parsers. The CLI package also contains some useful Typescript definitions.

## Installation

```bash
npm install @beff/cli
```

## CLI Options

| Option       | Description                            | Default   |
| ------------ | -------------------------------------- | --------- |
| -p --project | Path to the beff.json file             | beff.json |
| -v --verbose | Print debug information to the console | false     |
| -w --watch   | Monitors files for changes             | false     |
| -h --help    | Prints a list of all commands          |           |

### Example

```bash
npx beff -p beff.json
```

## beff.json Options

| Option    | Description                                                            |
| --------- | ---------------------------------------------------------------------- |
| router    | Relative path to the router entrypoint. [Learn more](/docs/cli#router) |
| parser    | Relative path to the parser entrypoint. [Learn more](/docs/cli#parser) |
| outputDir | Relative path to the folder where generated files will be output       |
| module    | One of `cjs` or `esm`, defaults to `esm` \*                            |

\* Module controls how the generated files will import themselves. `cjs` stands for CommonJs, `esm` stands for ES Modules. `esm` will likely work out of the box. If you have bundling issues, try changing it to `cjs`.

### Example

```json title="/beff.json"
{
  "router": "./router.ts",
  "outputDir": "./generated"
}
```

## Router

### Definition

A Beff router must be a single file. This file should contain a **default export** with the HTTP endpoint definitions. Spreading or combining two routers is not supported yet.

#### Example

```ts title="/router.ts"
export default {
  "/posts": {
    get: () => {
      return [];
    },
  },
};
```

### Context

The first parameter of the handler function **must be** a type called `Ctx` or `Context`. The definition of context varies according to the selected runtime. Check the documentation of the runtime for the definition of context.

If the function receives no arguments, `Ctx` can be omitted. Otherwise, it must be defined. The compiler will report an error if this is not the case.

#### Example

```ts title="/router.ts"
// highlight-start
import { Ctx } from "@beff/hono";
// highlight-end
export default {
  "/posts": {
    // highlight-start
    get: (c: Ctx, offset: number, limit: number) => {
      // highlight-end
      return [];
    },
  },
};
```

### Path Parameters

Path parameters are defined using OpenAPI Syntax. A path parameter is a string for the parameter name surrounded by `{}`, for example `/post/{id}`.

A path parameter must be the only content of a route path part. For example `/post/{id}extra` is invalid. Beff supports wildcard paths only on middleware routes. [Learn more about middlewares.](/docs/cli#middleware-use)

#### Example

```ts title="/router.ts"
import { Ctx } from "@beff/hono";
export default {
  // highlight-start
  "/post/{id}": {
    get: (c: Ctx, id: string) => {
      // highlight-end
      return [];
    },
  },
};
```

:::caution

Path parameters must be used by the handler function. If a handler function doesn't use a path parameter the compiler will report an error.

:::

:::caution

Path parameters must be of type string, number or boolean. You can use union of booleans, strings, numbers and literals of strings and numbers. [Learn more about coercion.](/docs/cli#coercion)

:::

### Query Parameters

Parameters that can be coerced from string are query parameters. Complex parameters, those that contain arrays, objects or tuples, are request body. [Learn more about coercion, simple and complex types.](/docs/cli#coercion)

#### Example

```ts title="/router.ts"
import { Ctx } from "@beff/hono";
export default {
  "/posts": {
    // highlight-start
    get: (c: Ctx, offset: number, limit: number) => {
      // highlight-end
      return [];
    },
  },
};
```

:::caution

Query parameters must be of type string, number or boolean. You can use union of booleans, strings, numbers and literals of strings and numbers. [Learn more about coercion.](/docs/cli#coercion)

:::

### Request Body

Complex parameters, those that contain arrays, objects or tuples, are the request body. [Learn more about coercion, simple and complex types.](/docs/cli#coercion)

Beff will verify that the data is of the annotated type at execution time. [Learn more about validation.](/docs/cli#validation)

#### Example

```ts title="/router.ts"
import { Ctx } from "@beff/hono";
// highlight-start
type CreateCommentData = {
  title: string;
  content: string;
};
// highlight-end
export default {
  "/comments": {
    // highlight-start
    post: (c: Ctx, data: CreateCommentData) => {
      // highlight-end
      return c.database.insert(data);
    },
  },
};
```

:::caution

Request bodies are not limited to simple types but are limited to JSON serializable types. [Learn more about JSON serialization.](/docs/cli#serialization)

:::

### Response Body

A function can be annotated as returning a `Promise` or a plain type. The annotation is used as the HTTP endpoint response body.

A function that has no return type annotations will not generate automatic documentation. **It is recommended to always annotate return types.**

Beff will verify that the data is of the annotated type at execution time. [Learn more about validation.](/docs/cli#validation)

#### Example

```ts title="/router.ts"
type Post = {
  id: string;
  title: string;
  content: string;
};

type Comment = {
  id: string;
  content: string;
};
export default {
  "/posts": {
    // highlight-start
    get: async (): Promise<Post[]> => {
      // highlight-end
      return [];
    },
  },
  "/comments": {
    // highlight-start
    get: (): Comment[] => {
      // highlight-end
      return [];
    },
  },
};
```

:::caution

Response bodies are not limited to simple types but are limited to JSON serializable types. [Learn more about JSON serialization.](/docs/cli#serialization)

:::

:::danger

Automatic documentation for response bodies will not be generated unless types have been annotated. Type-Safe clients are able to infer un-annotated return types, though.

:::

### Serialization

Beff will check that types which are part of your schema must be JSON Serializable. If you include a type that is not on the schema, the compiler will report an error.

#### Valid Example

```ts title="/router.ts"
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
```

:::info

Beff also supports JSON Schema String Formats. [Learn more about `StringFormat`](/docs/cli#stringformat)

:::

#### Invalid Example

We hope to add to support for some of the currently invalid types. Stay tuned.

```ts title="/router.ts"
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
```

### Validation

Beff generates a very efficient, dependency-free, OpenAPI and JSON Schema compatible validator. You can use the validators stand alone. [Learn more about parsers.](/docs/cli#parser)

#### Inputs

Inputs to your functions are always validated. If the types are invalid, a response with the reason why is sent back to the user.

##### Example on invalid input

```json title="422"
{
  "message": "Error #1: Expected string ~ Path: requestBody.a ~ Received: 123"
}
```

#### Outputs

Response bodies that are annotated will be validated. If types are invalid, a response without the reason why is sent back to the user. You can use the runtime error catching abilities to monitor or change such errors. [Learn more.](/docs/hono)

##### Example on invalid response

```json title="500"
{
  "message": "Unknown error"
}
```

### Coercion

Simple types are strings, numbers and booleans, and literals of these - also, union of these.

Array, object and tuples are complex and cannot be coerced.

When path, query and header parameters are not strings, but are simple, they'll be coerced before being validated. That means that even though a path or query parameter is always serialized as a string in the URL, you can safely use them as other types.

Coercion only works on valid inputs. Coercing `abc` to number will not work. After coercion, data is still [validated](/docs/cli#validation).

#### Example

```ts title="/router.ts"
import { Ctx } from "@beff/hono";
export default {
  "/posts": {
    // highlight-start
    get: (c: Ctx, offset: number, limit: number) => {
      // highlight-end
      return [];
    },
  },
};
```

### Middleware (use)

Middlewares can be used to control the request on a lower level. You can pass an array of middlewares to the `use` handler.

Path maps that only have `use` handlers can use wildcards (`*`) in their path patterns.

#### Example

```ts title="/router.ts"
import { Ctx } from "@beff/hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
export default {
  // highlight-start
  // wildcard is only valid if the map only has "use"
  "/*": {
    use: [cors()],
  },
  // highlight-end
  "/posts": {
    // highlight-start
    // use is also valid on a regular path pattern
    use: [prettyJSON()],
    // highlight-end
    get: (c: Ctx, offset: number, limit: number) => {
      return [];
    },
  },
};
```

:::info

`use` handlers are removed from automatic generated clients.

:::

### Header Parameters

Header parameters are defined by using the `Header` type exported from `@beff/cli`. The type argument on `Header` defines the coerced type of the header. [Learn more about coercion.](/docs/cli#coercion)

#### Example

```ts title="/router.ts"
import { Ctx } from "@beff/hono";
// highlight-start
import { Header } from "@beff/cli";
// highlight-end

export default {
  "/posts": {
    // highlight-start
    get: (c: Ctx, authentication: Header<string>, count: Header<number>) => {
      // highlight-end
      return [];
    },
  },
};
```

:::caution

Header parameters must be of type string, number or boolean. You can use union of booleans, strings, numbers and literals of strings and numbers. [Learn more about coercion.](/docs/cli#coercion)

:::

## Parser

Beff supports using the generated validators imperatively. Configure `beff.json` to have a parser entrypoint, and use `builderParsers` to generate type-safe and efficient parsers.

You don't need a router entrypoint to use a parser entrypoint.

### Example

```json title="/beff.json"
{
  "parser": "./parser.ts",
  "outputDir": "./generated"
}
```

```ts title="/parser.ts"
// Notice you need to import from the generated file
// It's not an issue if it doesn't exist yet.
import parser from "./bff-generated/parser";

export type User = {
  name: string;
  age: number;
};
export const {
  // it is convenient to export the type and parser with the same name
  User,
} = parser.buildParsers<{
  User: User;
}>();

const data = User.parse({ name: "Name", age: 123 });
const safe = User.safeParse({ name: "Name", age: 123 });
```

:::caution

`builderParsers` can only be called once. The compiler will emit an error if it is called more than once.

:::

### StringFormat

JSON Schema and OpenAPI support defining a `format` for a string. For instance, `uuid-v4` or `email`.

Use `StringFormat` to create a type that represents a string with format. Notice you need to register the validator for that string format.

#### Example

```ts title="/parser.ts"
import { StringFormat } from "@beff/cli";
// Notice you need to import from the generated file
// It's not an issue if it doesn't exist yet.
import parser from "./bff-generated/parser";

export type StartsWithA = StringFormat<"StartsWithA">;
parser.registerStringFormat<StartsWithA>("StartsWithA", (it) =>
  it.startsWith("A")
);
```

:::caution

To make it easier to use validators from NPM libraries, Beff does not check at compile time that custom string formats were properly registered. An attempt to validate a string format that was not registered will fail at execution time.

:::
