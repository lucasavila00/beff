import { it, expect } from "vitest";
import { Codecs } from "../src/parser";
it("works", () => {
  expect(Codecs.string.describe()).toMatchInlineSnapshot('"type string = string;"');
  expect(Codecs.number.describe()).toMatchInlineSnapshot('"type number = number;"');
  expect(Codecs.boolean.describe()).toMatchInlineSnapshot('"type boolean = boolean;"');
  expect(Codecs.null.describe()).toMatchInlineSnapshot('"type null = null;"');
  expect(Codecs.undefined.describe()).toMatchInlineSnapshot('"type undefined = null;"');
  expect(Codecs.object.describe()).toMatchInlineSnapshot('"type object = { [K in string]: any };"');
  expect(Codecs.anyArray.describe()).toMatchInlineSnapshot('"type anyArray = Array<any>;"');
  expect(Codecs.any.describe()).toMatchInlineSnapshot('"type any = any;"');

  expect(Codecs.T1.describe()).toMatchInlineSnapshot('"type T1 = { a: string, b: number };"');
  expect(Codecs.T2.describe()).toMatchInlineSnapshot('"type T2 = { t1: { a: string, b: number } };"');
  expect(Codecs.T3.describe()).toMatchInlineSnapshot(
    '"type T3 = { t2Array: Array<{ t1: { a: string, b: number } }> };"',
  );
  //expect(Codecs.SemVer.describe()).toMatchInlineSnapshot('"type SemVer = todo describeRegexDecoder;"');
  expect(Codecs.NonEmptyString.describe()).toMatchInlineSnapshot(
    '"type NonEmptyString = [string, ...string];"',
  );
  expect(Codecs.DiscriminatedUnion.describe()).toMatchInlineSnapshot(
    '"type DiscriminatedUnion = ({ a1: string, a11: (null | string), subType: \\"a1\\", type: \\"a\\" } | { a2: string, subType: \\"a2\\", type: \\"a\\" } | { type: \\"b\\", value: number });"',
  );

  expect(Codecs.ValidCurrency.describe()).toMatchInlineSnapshot(
    '"type ValidCurrency = StringFormat<\\"ValidCurrency\\">;"',
  );

  // expect(Codecs.RecursiveTree.describe()).toMatchInlineSnapshot(
  //   '"{ children: Array<[object Object]>, value: number }"',
  // );
});
