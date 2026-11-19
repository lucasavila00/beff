import { describe, expect, it } from "vitest";
import { b, createNamedType, overrideNamedType } from "../src/index.js";

describe("overrideNamedType", () => {
  it("changes a named type that other parsers already use", () => {
    const Id = createNamedType("OverrideTestId", b.String());
    const User = b.Object({ id: Id, tags: b.Array(Id) });

    // Use the parsers before the override.
    expect(Id.validate("a")).toBe(true);
    expect(User.validate({ id: "a", tags: ["b"] })).toBe(true);
    expect(User.validate({ id: 1, tags: [2] })).toBe(false);

    overrideNamedType("OverrideTestId", b.Number());

    expect(Id.validate(1)).toBe(true);
    expect(Id.validate("a")).toBe(false);
    expect(User.parse({ id: 1, tags: [2] })).toEqual({ id: 1, tags: [2] });
    expect(User.safeParse({ id: "a", tags: [2] })).toEqual({
      success: false,
      errors: [{ message: "expected number", path: ["id"], received: "a" }],
    });
    expect(User.describe()).toBe(
      "type OverrideTestId = number;\n\n{ id: OverrideTestId, tags: Array<OverrideTestId> }",
    );
    expect(User.schema()).toEqual(b.Object({ id: b.Number(), tags: b.Array(b.Number()) }).schema());
    expect(User.hash()).toBe(b.Object({ id: b.Number(), tags: b.Array(b.Number()) }).hash());
  });

  it("can make a named type recursive", () => {
    const Node = createNamedType("OverrideTestNode", b.Null());
    overrideNamedType("OverrideTestNode", b.Object({ next: Node }));

    expect(Node.validate({ next: { next: null } })).toBe(false);
    overrideNamedType("OverrideTestNode", b.Object({ next: b.Array(Node) }));
    expect(Node.validate({ next: [{ next: [] }] })).toBe(true);
    expect(Node.validate({ next: [{ next: [1] }] })).toBe(false);
  });

  it("throws for a name that does not exist, and for a name that exists already", () => {
    expect(() => overrideNamedType("OverrideTestMissing", b.String())).toThrowError(
      "Named type OverrideTestMissing does not exist",
    );
    expect(() => createNamedType("OverrideTestId", b.String())).toThrowError(
      "Named type OverrideTestId already exists",
    );
  });
});
