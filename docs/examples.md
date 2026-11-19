# Examples

This page shows how to use Beff in a small application. All the examples use the same types and parser file.

## Project files

`beff.json`:

```json
{
  "parser": "./src/parser.ts",
  "outputDir": "./src/generated",
  "stringFormats": [{ "name": "Email" }, { "name": "IsoDate" }],
  "numberFormats": [{ "name": "Port" }]
}
```

`src/types.ts`:

```ts
import { NumberFormat, StringFormat } from "@beff/client";

export type Email = StringFormat<"Email">;
export type IsoDate = StringFormat<"IsoDate">;
export type Port = NumberFormat<"Port">;

/** A user of the application. */
export type User = {
  id: string;
  /** The email address of the user. */
  email: Email;
  name: string;
  role: "admin" | "member";
  createdAt: IsoDate;
};

export type CreateUserRequest = Omit<User, "id" | "createdAt">;

export type Page<T> = {
  items: T[];
  nextCursor?: string;
};

export type Event =
  | { type: "user.created"; user: User }
  | { type: "user.deleted"; userId: string }
  | { type: "user.renamed"; userId: string; oldName: string; newName: string };

export type Comment = {
  author: string;
  text: string;
  replies: Comment[];
};

export type Config = {
  host: string;
  port: Port;
  logLevel: "debug" | "info" | "warn" | "error";
};
```

`src/parser.ts`:

```ts
import parse from "./generated/parser";
import { Comment, Config, CreateUserRequest, Event, Page, User } from "./types";

export const Parsers = parse.buildParsers<{
  User: User;
  CreateUserRequest: CreateUserRequest;
  UserPage: Page<User>;
  Event: Event;
  Comment: Comment;
  Config: Config;
}>({
  stringFormats: {
    Email: {
      validator: (input) => /^[^@\s]+@[^@\s]+$/.test(input),
      errorMessage: () => "expected an email address",
      jsonSchemaFormat: "email",
    },
    IsoDate: {
      validator: (input) => !Number.isNaN(Date.parse(input)),
      jsonSchemaFormat: "date-time",
    },
  },
  numberFormats: {
    Port: (input) => Number.isInteger(input) && input > 0 && input < 65536,
  },
});
```

Generate the validators:

```shell
npx beff -p beff.json
```

## Validate an API request body

Use `safeParse` to validate the request body. If the body is not valid, send the errors to the client.

```ts
import { printErrors } from "@beff/client";
import { Parsers } from "./parser";

function handleCreateUser(body: unknown) {
  const result = Parsers.CreateUserRequest.safeParse(body);
  if (!result.success) {
    return { status: 400, body: { error: printErrors(result.errors, ["body"]) } };
  }
  // Here, result.data has the type CreateUserRequest.
  return { status: 201, body: { id: "user_1", ...result.data } };
}

handleCreateUser({ email: "not-an-email", name: "Ana", role: "owner" });
// {
//   status: 400,
//   body: {
//     error: '#0 (body.email) expected an email address, received: "not-an-email" | #1 (body.role) expected one of "admin", "member", received: "owner"',
//   },
// }
```

## Handle events from a queue

Use `parse` when the input must be valid. TypeScript narrows the union in the `switch` statement.

```ts
function handleEvent(input: unknown): string {
  const event = Parsers.Event.parse(input);
  switch (event.type) {
    case "user.created":
      return `created ${event.user.name}`;
    case "user.deleted":
      return `deleted ${event.userId}`;
    case "user.renamed":
      return `renamed ${event.oldName} to ${event.newName}`;
  }
}

handleEvent({ type: "user.renamed", userId: "user_1", oldName: "Ana", newName: "Anna" });
// "renamed Ana to Anna"

handleEvent({ type: "user.renamed", userId: "user_1" });
// Error: Failed to parse Event - #0 (newName) expected string, received: undefined | #1 (oldName) expected string, received: undefined
```

## Load a configuration file

Validate the configuration when the application starts. Use `disallowExtraProperties` to find spelling errors in property names.

```ts
import { readFileSync } from "fs";

const config = Parsers.Config.parse(JSON.parse(readFileSync("config.json", "utf-8")), {
  disallowExtraProperties: true,
});
```

If `config.json` has a property `"logLevl": "info"`, `parse` throws an error. The error shows the incorrect property name.

## Validate recursive data

Beff supports recursive types. No more configuration is necessary.

```ts
Parsers.Comment.validate({
  author: "Ana",
  text: "Hello",
  replies: [{ author: "Bo", text: "Hi", replies: [] }],
});
// true
```

## Create an OpenAPI document

Use `schemaWithContext` to create one schema for each named type. Generic types get a name with their type arguments, for example `Page_User`.

```ts
import { SchemaPrintingContext } from "@beff/client";

const ctx = new SchemaPrintingContext({
  refPathTemplate: "#/components/schemas/{name}",
  definitionContainerKey: null,
});

const openapi = {
  openapi: "3.1.0",
  info: { title: "Users API", version: "1.0.0" },
  paths: {
    "/users": {
      get: {
        responses: {
          "200": {
            description: "A page of users",
            content: { "application/json": { schema: Parsers.UserPage.schemaWithContext(ctx) } },
          },
        },
      },
      post: {
        requestBody: {
          content: { "application/json": { schema: Parsers.CreateUserRequest.schemaWithContext(ctx) } },
        },
      },
    },
  },
  components: {
    // Contains IsoDate, Email, User, Page_User, and CreateUserRequest.
    schemas: ctx.exportDefinitions(),
  },
};
```

## Show the expected type

Use `describe` to show the expected type in a log or in an error message.

```ts
console.log(Parsers.UserPage.describe());
```

Output:

```text
type CodecUserPage = { items: Array<{
createdAt: StringFormat<"IsoDate">;
/** The email address of the user. */
email: StringFormat<"Email">;
id: string;
name: string;
role: ("admin" | "member");
}>, nextCursor?: string };
```
