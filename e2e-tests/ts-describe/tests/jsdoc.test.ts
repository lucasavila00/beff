import { it, expect } from "vitest";
import { Codecs } from "../src/parser";

it("prints parsed jsdoc comments in TypeScript descriptions", () => {
  expect(Codecs.JsdocSingleLineAlias.describe()).toMatchInlineSnapshot(`
    "/** Anonymous single-line alias. */
    type CodecJsdocSingleLineAlias = string;"
  `);
  expect(Codecs.JsdocMultilineObject.describe()).toMatchInlineSnapshot(`
    "/**
     * Anonymous multiline object.
     * 
     * Keeps an intentional blank line.
     */
    type CodecJsdocMultilineObject = {
    /** First documented field. */
    first: string;
    /** Second documented field. */
    second: number;
    };"
  `);
  expect(Codecs.JsdocMemberOnlyObject.describe()).toMatchInlineSnapshot(`
    "type CodecJsdocMemberOnlyObject = {
    /** Nullable first field. */
    alpha: (null | string);
    /** Required second field. */
    beta: string;
    /** Optional third field. */
    gamma?: number;
    };"
  `);
  expect(Codecs.JsdocNestedObject.describe()).toMatchInlineSnapshot(`
    "type CodecJsdocNestedObject = {
    /** Nested value. */
    nested: {
    /** Inner enabled flag. */
    enabled: boolean;
    };
    };"
  `);
  expect(Codecs.JsdocReferencesDocumentedAlias.describe()).toMatchInlineSnapshot(`
    "type CodecJsdocReferencesDocumentedAlias = {
    /** Reusable documented token. */
    token: StringFormat<\\"JsdocReusableToken\\">;
    };"
  `);
  expect(Codecs.JsdocUnionVariant.describe()).toMatchInlineSnapshot(`
    "type CodecJsdocUnionVariant = ({
    /** Right variant count. */
    count: number;
    kind: \\"right\\";
    } | {
    kind: \\"left\\";
    /** Left variant value. */
    value: string;
    });"
  `);
});

it("keeps documented members separated when a nullable field precedes another documented field", () => {
  const printed = Codecs.JsdocMemberOnlyObject.describe();

  expect(printed).toContain("alpha: (null | string);\n/** Required second field. */\nbeta: string;");
  expect(printed).not.toContain("string /** Required second field. */");
});

it("does not print non-jsdoc or non-adjacent comments as descriptions", () => {
  expect(Codecs.JsdocIgnoredCommentObject.describe()).toMatchInlineSnapshot(
    '"type CodecJsdocIgnoredCommentObject = { line: number, plain: string };"',
  );
  expect(Codecs.JsdocAfterUnrelatedValue.describe()).toMatchInlineSnapshot(
    '"type CodecJsdocAfterUnrelatedValue = string;"',
  );
});
