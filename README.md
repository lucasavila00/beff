# 🪄 Beff

Beff is a high-performance validator generator that creates efficient runtime validators from TypeScript types using a blazing-fast compiler.

## Why Choose Beff?

- **TypeScript First**: Unlike zod, io-ts, and similar libraries, Beff doesn't add overhead to the TypeScript compiler. Experience faster editor performance and quicker compile times.
- **Blazingly Fast**: Written in Rust and compiled to WebAssembly, Beff is cross-platform and lightning-quick. It compiles a hello-world project in 5ms and handles large projects with 200+ types in just 200ms.
- **Seamlessly Compatible**: Leverages the TypeScript compiler for path resolution. If your editor can resolve the types, Beff can too.
- **Optimized Output**: Generates highly efficient validator code with extensive compile-time optimizations.
- **Developer Friendly**: Provides clear, actionable error messages at both compile time and runtime.
- **Feature Complete**: Supports advanced TypeScript features including recursive types, generics, mapped types, conditional types, utility types (`Omit`, `Exclude`, `Partial`, `Required`, `Record`), and more. If a type can be validated at runtime, Beff understands it.

## Getting Started

Get up and running with Beff in just a few simple steps:

### 1. Install

Install the required packages from npm:

```shell
npm i @beff/cli @beff/client
```

### 2. Configure

Create a JSON file to configure Beff. The file can have any name, but it's standard practice to name it `beff.json`.

```json
{
  "parser": "./src/parser.ts",
  "outputDir": "./src/generated"
}
```

### 3. Create the parser file

Create a TypeScript file that exports the types you want Beff to generate validators for.

By convention, this file is typically named `parser.ts`:

```ts
import parse from "./generated/parser";

type User = {
  name: string;
  age: number;
};

export const Parsers = parse.buildParsers<{
  User: User;
}>();
```

### 4. Generate the validators

Run the Beff CLI to generate your validator code:

```shell
npx beff -p beff.json
```

### 5. Use the validators

Now you can use the generated validators in your application:

```ts
import { Parsers } from "./parser.ts";

const user1 = Parsers.User.parse({
  name: "John Doe",
  age: 42,
});

const maybeUser = Parsers.User.safeParse(null);

const isValid: boolean = Parsers.User.validate({
  name: "John Doe",
  age: 42,
});

const jsonSchema = Parsers.User.schema();
```

### 6. Generate reusable `$ref`-based schemas

`.schema()` stays flat and inlines the full schema for compatibility.

If you want reusable definitions for JSON Schema or OpenAPI documents, use `SchemaPrintingContext` with `.schemaWithContext(...)`:

```ts
import { Parsers } from "./parser.ts";
import { SchemaPrintingContext } from "@beff/client";

const ctx = new SchemaPrintingContext({
  refPathTemplate: "#/components/schemas/{name}",
  definitionContainerKey: null,
});

const requestSchema = Parsers.User.schemaWithContext(ctx);
// { $ref: "#/components/schemas/User" }

const openapi = {
  openapi: "3.1.0",
  paths: {
    "/users": {
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: requestSchema,
            },
          },
        },
      },
    },
  },
  components: {
    schemas: ctx.exportDefinitions(),
  },
};
```

By default, `SchemaPrintingContext` emits refs at `#/$defs/{name}` and exports definitions under `$defs`:

```ts
import { SchemaPrintingContext } from "@beff/client";

const ctx = new SchemaPrintingContext({
  refPathTemplate: "#/$defs/{name}",
  definitionContainerKey: "$defs",
});

const schema = Parsers.User.schemaWithContext(ctx);
const definitions = ctx.exportDefinitions();
```

## CLI Options

The `beff` binary can also run in watch mode.

```shell
$ npx beff -h
Usage: beff [options]

Generate validators from TypeScript types

Options:
  -p, --project <string>  Path to the project file
  -v, --verbose           Print verbose output
  -w, --watch             Watch for file changes
  -h, --help              display help for command
```

## Advanced Features

### Custom String Formats

Beff allows you to define custom string validation formats. First, configure your `beff.json`:

```json
{
  "parser": "./src/parser.ts",
  "outputDir": "./src/generated",
  "stringFormats": [
    {
      "name": "ValidCurrency"
    }
  ]
}
```

Then use the `StringFormat` helper to create a branded TypeScript type and define the runtime validator:

```ts
import parse from "./generated/parser";
import { StringFormat } from "@beff/client";
export type ValidCurrency = StringFormat<"ValidCurrency">;

export const Parsers = parse.buildParsers<{
  ValidCurrency: ValidCurrency;
}>({
  stringFormats: {
    ValidCurrency: {
      validator: (input: string) => {
        if (VALID_CURRENCIES.includes(input)) {
          return true;
        }
        return false;
      },
      errorMessage: () => "expected a valid ISO currency code",
    },
  },
});
```

Runtime format definitions support both forms:

```ts
stringFormats: {
  ValidCurrency: (input: string) => input === "USD",
}
```

```ts
stringFormats: {
  ValidCurrency: {
    validator: (input: string) => input === "USD",
    errorMessage: (input: string) => `expected ISO currency code, got ${input}`,
  },
}
```

`errorMessage` is optional. When provided, failed parses use it instead of the default `expected string with format "..."` message.

This also works with `StringFormatExtends`. If multiple formats in the chain define an `errorMessage`, the upper / more specific one wins:

```ts
import { StringFormat, StringFormatExtends } from "@beff/client";

export type UserId = StringFormat<"UserId">;
export type ReadAuthorizedUserId = StringFormatExtends<UserId, "ReadAuthorizedUserId">;
export type WriteAuthorizedUserId = StringFormatExtends<ReadAuthorizedUserId, "WriteAuthorizedUserId">;

const Parsers = parse.buildParsers({
  stringFormats: {
    UserId: {
      validator: (input: string) => input.startsWith("user_"),
      errorMessage: () => "expected a valid user id",
    },
    ReadAuthorizedUserId: {
      validator: (input: string) => input.includes("_read_"),
      errorMessage: () => "expected user with read permissions",
    },
    WriteAuthorizedUserId: {
      validator: (input: string) => input.includes("_write_"),
      errorMessage: () => "expected user with write permissions",
    },
  },
});
```

### Custom Number Formats

Similarly, you can define custom number validation formats. Configure your `beff.json`:

```json
{
  "parser": "./src/parser.ts",
  "outputDir": "./src/generated",
  "numberFormats": [
    {
      "name": "NonNegativeNumber"
    }
  ]
}
```

Then use the `NumberFormat` helper to create a branded TypeScript type and define the runtime validator:

```ts
import parse from "./generated/parser";
import { NumberFormat } from "@beff/client";
export type NonNegativeNumber = NumberFormat<"NonNegativeNumber">;

export const Parsers = parse.buildParsers<{
  NonNegativeNumber: NonNegativeNumber;
}>({
  numberFormats: {
    NonNegativeNumber: {
      validator: (input: number) => {
        return input >= 0;
      },
      errorMessage: () => "expected a non-negative number",
    },
    NegativeNumber: {
      validator: (input: number) => {
        return input < 0;
      },
    },
  },
});
```

`errorMessage` also works for number formats. It can be omitted, and with `NumberFormatExtends` the upper / more specific format message wins when multiple formats define one.

### Ad-hoc Validator Creation

Beff provides a runtime type creation API similar to `zod` and `io-ts` for simple use cases.

**Note:** This API is intentionally limited and supports only basic types to maintain fast editor performance. A more comprehensive runtime API would essentially make Beff just another re-implementation of zod, defeating its core purpose. For complex types, use Beff's primary feature of compiling TypeScript types.

Validators created with the ad-hoc API have the same interface as compiled validators:

```ts
import { b } from "@beff/client";

const AdHocItem = b.Object({
  str: b.String(),
  num: b.Number(),
  bool: b.Boolean(),
  undefined: b.Undefined(),
  null: b.Null(),
  any: b.Any(),
  unknown: b.Unknown(),
});

const AdHocList = b.Array(AdHocItem);

const ls = AdHocList.parse([]);
```

### Zod Compatibility

Beff provides seamless interoperability with Zod. Call `.zod()` on any Beff parser to get a compatible Zod schema.

This makes it easy to gradually migrate existing Zod-based codebases:

```ts
import { Parsers } from "./parser.ts";
import { z } from "zod";

const users = z.array(Parsers.User.zod()).parse({
  name: "John Doe",
  age: 42,
});
```

## Contributing

Please read [CONTRIBUTING.md](/CONTRIBUTING.md)
