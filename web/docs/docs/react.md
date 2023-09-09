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

TODO: explain overriding fetch, all params

#### Example

```ts
import { buildReactQueryClient } from "@beff/react";
// The client file contains only the minimal amount of data required.
import generated from "../../../generated/client";

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
