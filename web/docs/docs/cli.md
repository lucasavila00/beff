---
sidebar_position: 2
---

# @beff/cli

The CLI executable is used to generate the support code for the parser or router.

The CLI package also contains some useful Typescript definitions.

## Installation

```bash
npm install @beff/cli
```

## CLI Options

| Option       | Description                            | Default   |
| ------------ | -------------------------------------- | --------- |
| -p --project | Path to the beff.json file             | beff.json |
| -v --verbose | Print debug information to the console | false     |
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
| module    | One of `cjs` or `esm`, defaults to `esm`                               |

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

### Header Parameters

TODO
:::caution

Header parameters must be of type string, number or boolean. You can use union of booleans, strings, numbers and literals of strings and numbers. [Learn more about coercion.](/docs/cli#coercion)

:::

### Request Body

TODO

### Response Body

TODO

### Validation and error messages

TODO

### Throwing errors

TODO

### Coercion

TODO

### Middleware (use)

## Parser

TODO

## Exports

TODO

### Header

TODO

### StringFormat

TODO
