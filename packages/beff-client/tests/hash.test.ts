import { createHash } from "node:crypto";
import { it, expect } from "vitest";
import { Hash256Writer } from "../src/hash";

function u32be(value: number): Buffer {
  const out = Buffer.alloc(4);
  out.writeUInt32BE(value);
  return out;
}

function token(kind: number, value: string): Buffer {
  const bytes = Buffer.from(value, "utf8");
  return Buffer.concat([Buffer.from([kind]), u32be(bytes.length), bytes]);
}

it("Hash256Writer produces SHA-256 hex for canonical tokens", () => {
  expect(new Hash256Writer().digestHex()).toBe(
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );

  const writer = new Hash256Writer();
  writer.updateTag("object");
  writer.updateString("field");
  writer.updateNumber(-0);
  writer.updateBoolean(true);
  writer.updateNull();

  const expected = createHash("sha256")
    .update(
      Buffer.concat([
        token(1, "object"),
        token(2, "field"),
        token(3, "-0"),
        Buffer.from([4]),
        Buffer.from([6]),
      ]),
    )
    .digest("hex");

  expect(writer.digestHex()).toBe(expected);
});
