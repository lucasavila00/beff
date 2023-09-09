# Beff

> The power of TRpc and Zod, the simplicity of FastAPI. Powered by a compiler à la Tailwind.

## Development Environment Requirements

- Node 18+

## Installation

`npm install @beff/cli`

You will also need to install a runtime.

`npm install @beff/hono @hono/node-server`

## Example

### Create it

Create a file `beff.json` with:

```json
{
  "router": "./router.ts",
  "outputDir": "./generated"
}
```

Create a file `router.ts` with:

```ts
import { Ctx } from "@beff/hono";

type RootResponse = { Hello: string };
type ItemsResponse = { item_id: string; q?: string };

export default {
  "/": {
    get: async (): Promise<RootResponse> => {
      return { Hello: "World" };
    },
  },
  "/items/{item_id}": {
    get: (c: Ctx, item_id: string, q?: string): ItemsResponse => {
      return { item_id, q };
    },
  },
};
```

!> Type annotations are always required in the router. Beff makes it worth it, though. We'll get to it later.

Create a file `index.ts` with:

```ts
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

### Compile it

```bash
npx beff -p beff.json && npx esbuild index.ts --bundle --platform=node --target=node16 --outdir=dist
```

?> You can also add a task in your package.json `"beff": "beff -p beff.json"` and use it with `npm run beff`.

### Run it

```bash
node dist/index.js
```

### Check it

Open your browser at <a href="http://127.0.0.1:3040/items/5?q=somequery" class="external-link" target="_blank">http://127.0.0.1:3040/items/5?q=somequery</a>.

You will see the JSON response as:

```json
{ "item_id": 5, "q": "somequery" }
```

You already created an API that:

- Receives HTTP requests in the _paths_ `/` and `/items/{item_id}`.
- Both _paths_ take `GET` <em>operations</em> (also known as HTTP _methods_).
- The _path_ `/items/{item_id}` has a _path parameter_ `item_id` that should be an `int`.
- The _path_ `/items/{item_id}` has an optional `str` _query parameter_ `q`.

### Interactive API docs

Now go to <a href="http://127.0.0.1:3040/docs" class="external-link" target="_blank">http://127.0.0.1:3040/docs</a>.

You will see the automatic interactive API documentation (provided by <a href="https://github.com/swagger-api/swagger-ui" class="external-link" target="_blank">Swagger UI</a>):

![First example docs](_media/first_example_docs.png ":size=800")
