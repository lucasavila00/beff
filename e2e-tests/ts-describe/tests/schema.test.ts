import { it, expect } from "vitest";
import { Codecs } from "../src/parser";
it("works", () => {
  expect(Codecs.string.describe()).toMatchInlineSnapshot('"type Codecstring = string;"');
  expect(Codecs.number.describe()).toMatchInlineSnapshot('"type Codecnumber = number;"');
  expect(Codecs.boolean.describe()).toMatchInlineSnapshot('"type Codecboolean = boolean;"');
  expect(Codecs.null.describe()).toMatchInlineSnapshot('"type Codecnull = null;"');
  expect(Codecs.undefined.describe()).toMatchInlineSnapshot('"type Codecundefined = null;"');
  expect(Codecs.object.describe()).toMatchInlineSnapshot('"type Codecobject = { [K in (string | number)]: any };"');
  expect(Codecs.anyArray.describe()).toMatchInlineSnapshot('"type CodecanyArray = Array<any>;"');
  expect(Codecs.any.describe()).toMatchInlineSnapshot('"type Codecany = any;"');

  expect(Codecs.T1.describe()).toMatchInlineSnapshot('"type CodecT1 = { a: string, b: number };"');
  expect(Codecs.T2.describe()).toMatchInlineSnapshot('"type CodecT2 = { t1: { a: string, b: number } };"');
  expect(Codecs.T3.describe()).toMatchInlineSnapshot(
    '"type CodecT3 = { t2Array: Array<{ t1: { a: string, b: number } }> };"',
  );
  expect(Codecs.SemVer.describe()).toMatchInlineSnapshot(
    '"type CodecSemVer = `${number}.${number}.${number}`;"',
  );
  expect(Codecs.NonEmptyString.describe()).toMatchInlineSnapshot(
    '"type CodecNonEmptyString = [string, ...Array<string>];"',
  );
  expect(Codecs.DiscriminatedUnion.describe()).toMatchInlineSnapshot(
    '"type CodecDiscriminatedUnion = ({ a1: string, a11: (null | string), subType: \\"a1\\", type: \\"a\\" } | { a2: string, subType: \\"a2\\", type: \\"a\\" } | { type: \\"b\\", value: number });"',
  );

  expect(Codecs.ValidCurrency.describe()).toMatchInlineSnapshot(
    '"type CodecValidCurrency = StringFormat<\\"ValidCurrency\\">;"',
  );

  expect(Codecs.RecursiveTree.describe()).toMatchInlineSnapshot(`
    "type RecursiveTree = { children: Array<RecursiveTree>, value: number };

    type CodecRecursiveTree = RecursiveTree;"
  `);
});
