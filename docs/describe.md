# Describe

`describe()` returns the type of a validator as TypeScript code. Use it to show the expected input to a person. For example:

- Show the expected type in an API error response or in a log.
- Show the type in generated documentation.
- Give the type to an LLM in a prompt, so that it can return data that the validator accepts.

## Example

```ts
/** A registered user. */
type User = {
  /** The full name of the user. */
  name: string;
  age: number;
  email?: string;
};

type Team = {
  lead: User;
  members: User[];
};

export const Parsers = parse.buildParsers<{ User: User; Team: Team }>();
```

```ts
console.log(Parsers.Team.describe());
```

Output:

```text
/** A registered user. */
type User = {
age: number;
email?: string;
/** The full name of the user. */
name: string;
};

type CodecTeam = { lead: User, members: Array<User> };
```

## How Beff prints the type

- The validator type has the name `Codec<Name>`. `<Name>` is the property name in `buildParsers`.
- If the type uses a named type more than one time, Beff prints the named type as a separate `type` declaration. A recursive type is always a separate declaration.
- If the type uses a named type one time only, Beff puts it inline.
- Beff keeps JSDoc comments.
- Beff sorts object properties by name.

Beff does not format the output. If you show the output to people, you can format it with a tool such as Prettier.

## Recursive types

```ts
type Tree = { value: number; children: Tree[] };

Parsers.Tree.describe();
```

Output:

```text
type Tree = { children: Array<Tree>, value: number };

type CodecTree = Tree;
```

## Runtime validators

`describe()` also works on validators from the `b` API. Refer to [Runtime validators](./runtime-validators.md). These validators have no name. Thus, Beff prints only the type:

```ts
import { b } from "@beff/client";

b.Object({ name: b.String(), tags: b.Array(b.String()) }).describe();
// { name: string, tags: Array<string> }
```
