---
sidebar_position: 5
---

# @beff/react

## Installation

```bash
npm install @beff/react
```

## Exports

### buildReactQueryClient

Creates a Type-Safe and OpenAPI compatible client based on your router, already integrated with React Query.

#### Options

| Option    | Required | Description                                                        |
| --------- | -------- | ------------------------------------------------------------------ |
| generated | Y        | Path the client output of @beff/cli                                |
| fetchFn   | N        | An optional function that fetches a Request and returns a Response |
| baseUrl   | N        | Base URL to create requests                                        |

#### Example

```ts
import { buildReactQueryClient } from "@beff/react";
// The client file contains only the minimal amount of data required.
import generated from "../../../generated/router";
import type { AppRouter } from "../../../server";

export const beff = buildReactQueryClient<AppRouter>({
  generated,
  baseUrl: "http://localhost:2022",
});
```

```ts
import React from "react";
import { beff } from "./utils/beff";

export function Show() {
  const result = beff["/"].get().useQuery();
  return <div>{result.data?.Hello}</div>;
}
```
