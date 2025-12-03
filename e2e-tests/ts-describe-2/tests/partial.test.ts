import { it, expect } from "vitest";
import { Codecs } from "../src/parser";

export type BeforeRequired = {
  a: string;
  b: string | undefined;
  c: string | void;
  d: string | null;
  e?: string;
};
export type KeyofBeforeRequired = keyof BeforeRequired;

export type AfterRequired = Required<BeforeRequired>;
export type KeyofAfterRequired = keyof AfterRequired;

it("works", () => {
  expect(Codecs.BeforeRequired.describe()).toMatchInlineSnapshot(
    '"type CodecBeforeRequired = { a: string, b: (undefined | string), c: (void | string), d: (null | string), e?: string };"',
  );
  expect(Codecs.KeyofBeforeRequired.describe()).toMatchInlineSnapshot(
    '"type CodecKeyofBeforeRequired = (\\"b\\" | \\"e\\" | \\"a\\" | \\"d\\" | \\"c\\");"',
  );

  expect(Codecs.AfterRequired.describe()).toMatchInlineSnapshot(
    '"type CodecAfterRequired = { a: string, b: (undefined | string), c: (void | string), d: (null | string), e: string };"',
  );
  expect(Codecs.KeyofAfterRequired.describe()).toMatchInlineSnapshot(
    '"type CodecKeyofAfterRequired = (\\"b\\" | \\"e\\" | \\"a\\" | \\"d\\" | \\"c\\");"',
  );
});
