# Getting started

## Install the packages

Beff has two packages:

- `@beff/cli` generates the validator code.
- `@beff/client` contains the runtime code that the generated validators use.

Install the two packages:

```shell
npm i @beff/cli @beff/client
```

## Create the configuration file

Beff reads its configuration from a JSON file. The file can have any name. The usual name is `beff.json`.

```json
{
  "parser": "./src/parser.ts",
  "outputDir": "./src/generated"
}
```

### Configuration options

| Option          | Required | Description                                                                          |
| --------------- | -------- | ------------------------------------------------------------------------------------ |
| `parser`        | Yes      | The path to the parser file. Beff reads the types from this file.                    |
| `outputDir`     | Yes      | The directory for the generated files.                                               |
| `module`        | No       | The module format of the generated code: `"esm"` or `"cjs"`. The default is `"esm"`. |
| `stringFormats` | No       | A list of custom string formats. Refer to [Custom formats](./custom-formats.md).     |
| `numberFormats` | No       | A list of custom number formats. Refer to [Custom formats](./custom-formats.md).     |

All paths are relative to the configuration file.

## Create the parser file

The parser file tells Beff which types to compile. The usual name is `parser.ts`.

1. Import the generated module.
2. Call `buildParsers` with a type argument.
3. In the type argument, write an object type. Each property is the name of a validator. Each property type is the type to validate.

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

The types can come from other files. Beff uses the TypeScript compiler to find imported files.

## Generate the validators

Run the CLI:

```shell
npx beff -p beff.json
```

Beff writes `parser.js` and `parser.d.ts` to the `outputDir` directory.

Run the CLI again each time you change a type. You can also use watch mode. Watch mode generates the validators again when a file changes:

```shell
npx beff -p beff.json -w
```

You can add the command to `package.json`:

```json
{
  "scripts": {
    "beff": "beff -p beff.json"
  }
}
```

### CLI options

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

## Use the validators

Each property of `Parsers` is a validator. The API uses the word "parser" in some names, for example `buildParsers`. In this documentation, a validator is an object that `buildParsers` returns. Refer to [Parsers](./parsers.md) for the full list of methods.

```ts
import { Parsers } from "./parser";

// Returns the value, or throws an error.
const user = Parsers.User.parse({ name: "John Doe", age: 42 });

// Returns a result object. It does not throw an error.
const result = Parsers.User.safeParse(null);

// Returns true or false.
const isValid: boolean = Parsers.User.validate({ name: "John Doe", age: 42 });

// Returns a JSON Schema.
const jsonSchema = Parsers.User.schema();
```

## Next steps

- [Parsers](./parsers.md): the methods of a validator.
- [Errors](./errors.md): the error format.
- [Examples](./examples.md): complete examples.
