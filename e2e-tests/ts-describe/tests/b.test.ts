import { b, buntyped, createNamedType, overrideNamedType } from "@beff/client";
import { it, expect } from "vitest";

const Person = createNamedType(
  "Person",
  b.Object({
    name: b.String(),
    age: b.Number(),
  }),
);

const RecursivePerson = createNamedType("RecursivePerson", b.Unknown());
overrideNamedType(
  "RecursivePerson",
  b.Object({
    name: b.String(),
    age: b.Number(),
    parent: RecursivePerson,
  }),
);

it("works", () => {
  expect(
    b
      .Object({
        a: b.String(),
        b: b.Number(),
      })
      .describe(),
  ).toMatchInlineSnapshot('"{ a: string, b: number }"');
  expect(b.String().describe()).toMatchInlineSnapshot('"string"');
  expect(b.Number().describe()).toMatchInlineSnapshot('"number"');
  expect(b.Boolean().describe()).toMatchInlineSnapshot('"boolean"');
  expect(b.Array(b.String()).describe()).toMatchInlineSnapshot('"Array<string>"');
  expect(b.ReadOnlyArray(b.String()).describe()).toMatchInlineSnapshot('"Array<string>"');
  expect(b.Undefined().describe()).toMatchInlineSnapshot('"undefined"');
  expect(b.Null().describe()).toMatchInlineSnapshot('"null"');
  expect(b.Any().describe()).toMatchInlineSnapshot('"any"');
  expect(b.Unknown().describe()).toMatchInlineSnapshot('"any"');
  expect(b.Void().describe()).toMatchInlineSnapshot('"void"');
  expect(b.Const("a").describe()).toMatchInlineSnapshot('"\\"a\\""');
  expect(buntyped.Union(b.Const("a"), b.Const("b")).describe()).toMatchInlineSnapshot(
    '"(\\"a\\" | \\"b\\")"',
  );

  expect(Person.describe()).toMatchInlineSnapshot('"type CodecPerson = { age: number, name: string };"');
  expect(RecursivePerson.describe()).toMatchInlineSnapshot(
    `
    "type RecursivePerson = { age: number, name: string, parent: RecursivePerson };

    type CodecRecursivePerson = RecursivePerson;"
  `,
  );
});
