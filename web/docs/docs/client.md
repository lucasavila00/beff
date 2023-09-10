---
sidebar_position: 4
---

# @beff/client

## Installation

```bash
npm install @beff/client
```

## Exports

### buildClient

Creates a Type-Safe and OpenAPI compatible client based on your router.

#### Options

| Option    | Required | Description                                                        |
| --------- | -------- | ------------------------------------------------------------------ |
| generated | Y        | Path the client output of @beff/cli                                |
| fetchFn   | N        | An optional function that fetches a Request and returns a Response |
| baseUrl   | N        | Base URL to create requests                                        |

#### Example

```ts
import { buildClient } from "@beff/client";
// The client file contains only the minimal amount of data required.
import generated from "../../../generated/client";
import type { AppRouter } from "../../../server";

const fetchClient = buildClient<AppRouter>({
  generated,
  baseUrl: "http://localhost:2022",
});

fetchClient["/"].get().then((result) => {
  console.log(result.Hello);
});
```
