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

TODO: explain overriding fetch, all params

#### Example

```ts
import { buildClient } from "@beff/client";
// The client file contains only the minimal amount of data required.
import generated from "../../../generated/client";
const fetchClient = buildClient<AppRouter>({
  generated,
  baseUrl: "http://localhost:2022",
});

fetchClient["/"].get().then((result) => {
  console.log(result.Hello);
});
```
