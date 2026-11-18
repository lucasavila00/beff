# 🪄 Beff

Beff is a validator generator. It reads your TypeScript types and writes runtime validators for them.

## Why Beff?

- **No type-checker overhead**: Libraries such as zod and io-ts build types with TypeScript generics. Beff reads plain TypeScript types. Your editor and the TypeScript compiler do less work.
- **Fast**: Beff is a Rust program. It runs as WebAssembly. It compiles a small project in approximately 5 ms. It compiles a project with more than 200 types in approximately 200 ms.
- **Same path resolution as TypeScript**: Beff uses the TypeScript compiler to find imported files. If your editor finds a type, Beff finds it too.
- **Readable errors**: Each error shows the path, the expected type, and the received value. Refer to [Errors](./docs/errors.md).
- **Wide type support**: Beff supports recursive types, generics, mapped types, conditional types, template literal types, and utility types such as `Omit`, `Exclude`, `Partial`, `Required`, and `Record`.

## Quick start

1. Install the packages:

   ```shell
   npm i @beff/cli @beff/client zod@3
   ```

2. Create the file `beff.json`:

   ```json
   {
     "parser": "./src/parser.ts",
     "outputDir": "./src/generated"
   }
   ```

3. Create the file `src/parser.ts`:

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

4. Generate the validators:

   ```shell
   npx beff -p beff.json
   ```

5. Use the validators:

   ```ts
   import { Parsers } from "./parser";

   const user = Parsers.User.parse({ name: "John Doe", age: 42 });

   Parsers.User.parse({ name: "John Doe" });
   // Error: Failed to parse User - (age) expected number, received: undefined
   ```

For more information, read [Getting started](./docs/getting-started.md).

## Documentation

| Page                                               | Contents                                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------------------- |
| [Getting started](./docs/getting-started.md)       | Installation, `beff.json`, and the CLI.                                           |
| [Parsers](./docs/parsers.md)                       | `parse`, `safeParse`, `validate`, parse options, and `zod`.                       |
| [Errors](./docs/errors.md)                         | The error format and `printErrors`.                                               |
| [JSON Schema](./docs/json-schema.md)               | `schema`, `schemaWithContext`, and `SchemaPrintingContext`.                       |
| [Custom formats](./docs/custom-formats.md)         | `StringFormat`, `NumberFormat`, `StringFormatExtends`, and `NumberFormatExtends`. |
| [Describe](./docs/describe.md)                     | `describe`: print a validator as a TypeScript type.                               |
| [Hashes](./docs/hashes.md)                         | `hash` and `hash256`: compare the structure of two validators.                    |
| [Runtime validators](./docs/runtime-validators.md) | The `b` API, `createNamedType`, and `overrideNamedType`.                          |
| [Examples](./docs/examples.md)                     | Complete examples.                                                                |

## Contributing

Read [CONTRIBUTING.md](/CONTRIBUTING.md).
