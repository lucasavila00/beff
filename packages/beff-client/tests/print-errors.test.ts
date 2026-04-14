import { describe, expect, it } from "vitest";
import { printErrors } from "../src/err.js";
import { DecodeError, RegularDecodeError, UnionDecodeError } from "../src/types.js";

const regular = (message: string, path: string[], received: unknown): RegularDecodeError => ({
  message,
  path,
  received,
});

const union = (path: string[], received: unknown, errors: DecodeError[]): UnionDecodeError => ({
  path,
  received,
  errors,
  isUnionError: true,
});

describe("printUnionError", () => {
  it("prints multiple inner errors with 'one of' framing", () => {
    const err = union(["field"], true, [
      regular("expected string", [], true),
      regular("expected number", [], true),
    ]);
    expect(printErrors([err])).toMatchInlineSnapshot(
      `"(field) Failed to decode one of (expected string | expected number), received: true"`,
    );
  });

  it("shows up to 5 errors then truncates", () => {
    const errors = Array.from({ length: 7 }, (_, i) => regular(`expected type${i}`, [], "x"));
    const err = union([], "x", errors);
    expect(printErrors([err])).toMatchInlineSnapshot(
      '"Failed to decode one of (expected type0 OR expected type1 OR expected type2 OR expected type3 OR expected type4 and more...), received: \\"x\\""',
    );
  });
});

describe("printErrors top-level", () => {
  it("prints single regular error without numbering", () => {
    expect(printErrors([regular("expected string", ["name"], 42)])).toMatchInlineSnapshot(
      `"(name) expected string, received: 42"`,
    );
  });

  it("numbers multiple top-level errors", () => {
    expect(
      printErrors([regular("expected string", ["a"], 1), regular("expected number", ["b"], "x")]),
    ).toMatchInlineSnapshot('"#0 (a) expected string, received: 1 | #1 (b) expected number, received: \\"x\\""');
  });

  it("prints regular error with nested path (flattened union)", () => {
    // buildUnionError flattens single-branch unions into a RegularDecodeError
    // with the union's path prepended — this tests the printed output
    expect(
      printErrors([regular('expected one of "asc", "desc"', ["orderBy", "direction"], "ASC")]),
    ).toMatchInlineSnapshot(
      '"(orderBy.direction) expected one of \\"asc\\", \\"desc\\", received: \\"ASC\\""',
    );
  });
});
