import { it, expect } from "vitest";
import { Codecs } from "../src/parser";
it("works", () => {
  expect(Codecs.string.describe()).toMatchInlineSnapshot('"type Codecstring = string;"');
  expect(Codecs.number.describe()).toMatchInlineSnapshot('"type Codecnumber = number;"');
  expect(Codecs.boolean.describe()).toMatchInlineSnapshot('"type Codecboolean = boolean;"');
  expect(Codecs.null.describe()).toMatchInlineSnapshot('"type Codecnull = null;"');
  expect(Codecs.undefined.describe()).toMatchInlineSnapshot('"type Codecundefined = null;"');
  expect(Codecs.object.describe()).toMatchInlineSnapshot('"type Codecobject = { [K in string]: any };"');
  expect(Codecs.anyArray.describe()).toMatchInlineSnapshot('"type CodecanyArray = Array<any>;"');
  expect(Codecs.any.describe()).toMatchInlineSnapshot('"type Codecany = any;"');

  expect(Codecs.T1.describe()).toMatchInlineSnapshot(`
    "type T1 = { a: string, b: number };

    type CodecT1 = T1;"
  `);
  expect(Codecs.T2.describe()).toMatchInlineSnapshot(`
    "type T1 = { a: string, b: number };

    type T2 = { t1: T1 };

    type CodecT2 = T2;"
  `);
  expect(Codecs.T3.describe()).toMatchInlineSnapshot(
    `
    "type T1 = { a: string, b: number };

    type T2 = { t1: T1 };

    type T3 = { t2Array: Array<T2> };

    type CodecT3 = T3;"
  `,
  );
  expect(Codecs.SemVer.describe()).toMatchInlineSnapshot(`
    "type SemVer = \${number}.\${number}.\${number};

    type CodecSemVer = SemVer;"
  `);
  expect(Codecs.NonEmptyString.describe()).toMatchInlineSnapshot(
    `
    "type NonEmptyString = [string, ...string];

    type CodecNonEmptyString = NonEmptyString;"
  `,
  );
  expect(Codecs.DiscriminatedUnion.describe()).toMatchInlineSnapshot(
    `
    "type DiscriminatedUnion = ({ a1: string, a11: (null | string), subType: \\"a1\\", type: \\"a\\" } | { a2: string, subType: \\"a2\\", type: \\"a\\" } | { type: \\"b\\", value: number });

    type CodecDiscriminatedUnion = DiscriminatedUnion;"
  `,
  );

  expect(Codecs.ValidCurrency.describe()).toMatchInlineSnapshot(
    `
    "type ValidCurrency = StringFormat<\\"ValidCurrency\\">;

    type CodecValidCurrency = ValidCurrency;"
  `,
  );

  expect(Codecs.RecursiveTree.describe()).toMatchInlineSnapshot(`
    "type RecursiveTree = { children: Array<RecursiveTree>, value: number };

    type CodecRecursiveTree = RecursiveTree;"
  `);
});
