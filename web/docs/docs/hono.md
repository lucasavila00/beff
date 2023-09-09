---
sidebar_position: 3
---

# @beff/hono

`@beff/hono` transforms your router into a [`hono`](https://hono.dev/) app.

Hono can be used to perform authentication, logging, rate-limiting and much more on top of your app.

Notice that, for most use cases, `use middleware` should be enough. [Learn more about use middleware.](/docs/cli#middleware-use)

## Installation

```bash
npm install @beff/hono
```

## Exports

### Ctx

`Ctx` (`Context`) contains the `context` optional argument you pass to `buildHonoApp` and the `hono` context.

#### Example

```ts title="/router.ts"
import { Ctx as BeffCtx } from "@beff/hono";

// highlight-start
// We always need a type called `Ctx`
type Ctx = BeffCtx<
  // You can use any types as the first argument
  // as long as you provide them when building the app.
  { log: (msg: string) => void },
  // Hono specific configuration
  { KV_BINDING: KVNamespace }
>;
// highlight-end

export default {
  "/items/{item_id}": {
    get: (c: Ctx, item_id: string) => {
      // highlight-start
      c.log(`Getting item ${item_id}`);
      return c.hono.env.KV_BINDING.get(item_id);
      // highlight-end
    },
  },
};
```

```ts title="/index.ts"
import { buildHonoApp } from "@beff/hono";
import router from "./router";
import generated from "./generated/router";

export const app = buildHonoApp({
  router,
  generated,
  // highlight-start
  context: {
    log: (msg: string) => console.log(msg),
  },
  // highlight-end
});
```

### buildHonoApp

Creates a `hono` app from the router. Supports customizing the automatic generated documentation.

TODO: explain customization API

#### Example

```ts title="/index.ts"
import { serve } from "@hono/node-server";
import { buildHonoApp } from "@beff/hono";
import router from "./router";
import generated from "./generated/router";

const app = buildHonoApp({
  router,
  generated,
});
serve({
  fetch: app.fetch,
  port: 3040,
});

console.log(`Server running at http://localhost:3040/`);
console.log(`Check docs at at http://localhost:3040/docs`);
```

### buildHonoTestClient

Creates a client for your router, like the one provided by [`@beff/client`](/docs/client). Even though using it seems to be using the router directly, the client does create an HTTP request and calls the router with it. Writing tests for your router has never been easier.

#### Example

```ts title="/router.test.ts"
import { test, expect } from "vitest";
import { buildHonoTestClient, buildHonoApp } from "@beff/hono";
import router from "./router";
import generated from "./generated/router";

const app = buildHonoApp({
  router,
  generated,
});

const client = buildHonoTestClient<typeof router>({ app, generated });

test("get /", async () => {
  const result = await client["/"].get();
  expect(result).toMatchInlineSnapshot(`
    {
      "Hello": "World",
    }
  `);
});
test("get /items/{item_id}", async () => {
  const result = await client["/items/{item_id}"].get(
    "the item id",
    "query param"
  );
  expect(result).toMatchInlineSnapshot(`
    {
      "item_id": "the item id",
      "q": "query param",
    }
  `);
});
```

### isBffHttpException

TODO

#### Example

TODO
