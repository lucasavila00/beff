# Custom formats

A custom format adds a validation function to a `string` or `number` type. For example, a format can make sure that a string is a valid currency code.

Beff gives a branded TypeScript type for each format. Thus, the TypeScript compiler does not accept a plain `string` where your code expects a format.

## Add a string format

1. Add the format name to `stringFormats` in `beff.json`:

   ```json
   {
     "parser": "./src/parser.ts",
     "outputDir": "./src/generated",
     "stringFormats": [{ "name": "ValidCurrency" }]
   }
   ```

2. In the parser file, declare the type with `StringFormat`. Use the same name as in `beff.json`.
3. Give the validation function to `buildParsers` in the `stringFormats` object.

   ```ts
   import parse from "./generated/parser";
   import { StringFormat } from "@beff/client";

   const VALID_CURRENCIES = ["USD", "EUR"];

   export type ValidCurrency = StringFormat<"ValidCurrency">;

   export type Price = {
     amount: number;
     currency: ValidCurrency;
   };

   export const Parsers = parse.buildParsers<{
     Price: Price;
   }>({
     stringFormats: {
       ValidCurrency: (input: string) => VALID_CURRENCIES.includes(input),
     },
   });
   ```

To create a value with a format type, parse the data:

```ts
const price = Parsers.Price.parse({ amount: 10, currency: "USD" });
// The type of price.currency is ValidCurrency.
```

You must give a validation function for each format in `beff.json`. If a format has no function, `buildParsers` throws the error `Missing custom format <name>`.

## Add a number format

Number formats work the same as string formats. Use `numberFormats` in `beff.json`, the `NumberFormat` type, and the `numberFormats` object in `buildParsers`.

```json
{
  "parser": "./src/parser.ts",
  "outputDir": "./src/generated",
  "numberFormats": [{ "name": "NonNegativeNumber" }]
}
```

```ts
import parse from "./generated/parser";
import { NumberFormat } from "@beff/client";

export type NonNegativeNumber = NumberFormat<"NonNegativeNumber">;

export const Parsers = parse.buildParsers<{
  NonNegativeNumber: NonNegativeNumber;
}>({
  numberFormats: {
    NonNegativeNumber: (input: number) => input >= 0,
  },
});
```

## Format definitions

A format definition is a function or an object.

**Function:** The function receives the input. It returns `true` if the input is valid.

```ts
stringFormats: {
  ValidCurrency: (input: string) => input === "USD",
}
```

**Object:** The object has these properties:

| Property           | Required | Description                                                                                                   |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------- |
| `validator`        | Yes      | The validation function.                                                                                      |
| `errorMessage`     | No       | A function that receives the input and returns the error message. Refer to [Error messages](#error-messages). |
| `jsonSchemaFormat` | No       | The `format` value in the JSON Schema. Refer to [JSON Schema format](#json-schema-format).                    |

```ts
stringFormats: {
  ValidCurrency: {
    validator: (input: string) => input === "USD",
    errorMessage: (input: string) => `expected ISO currency code, got ${input}`,
    jsonSchemaFormat: "iso-currency-code",
  },
}
```

## Extend a format

Use `StringFormatExtends` or `NumberFormatExtends` to make a format from a different format. The new format adds a validation function to the base format.

A value is valid only if all the validation functions in the chain return `true`. Beff calls the validation functions in order, from the base format to the last format.

Example: `UserId` is the base format. `ReadAuthorizedUserId` extends `UserId`. `WriteAuthorizedUserId` extends `ReadAuthorizedUserId`.

1. Add all the format names to `beff.json`:

   ```json
   {
     "parser": "./src/parser.ts",
     "outputDir": "./src/generated",
     "stringFormats": [
       { "name": "UserId" },
       { "name": "ReadAuthorizedUserId" },
       { "name": "WriteAuthorizedUserId" }
     ]
   }
   ```

2. Declare the types and give a function for each format:

   ```ts
   import parse from "./generated/parser";
   import { StringFormat, StringFormatExtends } from "@beff/client";

   export type UserId = StringFormat<"UserId">;
   export type ReadAuthorizedUserId = StringFormatExtends<UserId, "ReadAuthorizedUserId">;
   export type WriteAuthorizedUserId = StringFormatExtends<ReadAuthorizedUserId, "WriteAuthorizedUserId">;

   export const Parsers = parse.buildParsers<{
     UserId: UserId;
     ReadAuthorizedUserId: ReadAuthorizedUserId;
     WriteAuthorizedUserId: WriteAuthorizedUserId;
   }>({
     stringFormats: {
       UserId: (input: string) => input.startsWith("user_"),
       ReadAuthorizedUserId: (input: string) => input.includes("_read_"),
       WriteAuthorizedUserId: (input: string) => input.includes("_write_"),
     },
   });
   ```

Results:

| Input                 | `UserId` | `ReadAuthorizedUserId` | `WriteAuthorizedUserId` |
| --------------------- | -------- | ---------------------- | ----------------------- |
| `"user_1"`            | Valid    | Not valid              | Not valid               |
| `"user_read_1"`       | Valid    | Valid                  | Not valid               |
| `"user_read_write_1"` | Valid    | Valid                  | Valid                   |

### TypeScript types

An extended format is also its base format. You can use a `WriteAuthorizedUserId` where your code expects a `ReadAuthorizedUserId` or a `UserId`. You cannot use a `UserId` where your code expects a `WriteAuthorizedUserId`.

```ts
declare const writer: WriteAuthorizedUserId;

const a: UserId = writer; // OK
const b: ReadAuthorizedUserId = writer; // OK

declare const user: UserId;
const c: WriteAuthorizedUserId = user; // Type error
```

### Number formats

`NumberFormatExtends` works the same as `StringFormatExtends`:

```ts
import { NumberFormat, NumberFormatExtends } from "@beff/client";

export type NonNegativeNumber = NumberFormat<"NonNegativeNumber">;
export type Percentage = NumberFormatExtends<NonNegativeNumber, "Percentage">;

// In buildParsers:
numberFormats: {
  NonNegativeNumber: (input: number) => input >= 0,
  Percentage: (input: number) => input <= 100,
}
```

## Error messages

If a validation function returns `false`, Beff uses the `errorMessage` of the last format in the chain that has one. If no format has an `errorMessage`, Beff uses a default message, for example `expected string with format "UserId"`.

Beff does not use the message of the validation function that returned `false`. Thus, write each `errorMessage` so that it is correct for the full chain.

```ts
stringFormats: {
  UserId: {
    validator: (input: string) => input.startsWith("user_"),
    errorMessage: () => "expected a valid user id",
  },
  ReadAuthorizedUserId: (input: string) => input.includes("_read_"),
  WriteAuthorizedUserId: {
    validator: (input: string) => input.includes("_write_"),
    errorMessage: () => "expected a user id with write permissions",
  },
}
```

| Validator               | Input      | Message                                     |
| ----------------------- | ---------- | ------------------------------------------- |
| `ReadAuthorizedUserId`  | `"user_1"` | `expected a valid user id` (from `UserId`)  |
| `WriteAuthorizedUserId` | `"user_1"` | `expected a user id with write permissions` |
| `WriteAuthorizedUserId` | `"abc"`    | `expected a user id with write permissions` |

## JSON Schema format

The JSON Schema of a format has a `format` property. Beff uses only the last format in the chain to find its value:

- If the last format has a `jsonSchemaFormat`, Beff uses it.
- If not, Beff uses all format names in the chain, joined with `and`.

With the definitions in the [Error messages](#error-messages) example, and `jsonSchemaFormat: "write-authorized-user-id"` on `WriteAuthorizedUserId`:

```ts
Parsers.WriteAuthorizedUserId.schema();
// { type: "string", format: "write-authorized-user-id" }

Parsers.ReadAuthorizedUserId.schema();
// { type: "string", format: "UserId and ReadAuthorizedUserId" }
```

For a number format, the schema type is `"number"`:

```ts
Parsers.Percentage.schema();
// { type: "number", format: "NonNegativeNumber and Percentage" }
```
