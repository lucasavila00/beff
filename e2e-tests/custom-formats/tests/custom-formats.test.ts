import { expect, it } from "vitest";
import { Codecs } from "../src/parser";

it("uses custom error messages for base string formats", () => {
  expect(Codecs.ValidCurrency.safeParse("ARS")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected a valid ISO currency code",
          "path": [],
          "received": "ARS",
        },
      ],
      "success": false,
    }
  `);
});

it("falls back to the default message for function-only string formats", () => {
  expect(Codecs.UserId.safeParse("abc")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string with format \\"UserId\\"",
          "path": [],
          "received": "abc",
        },
      ],
      "success": false,
    }
  `);
});

it("falls back to the default message for object string formats without errorMessage", () => {
  expect(Codecs.ShortCode.safeParse("LONG")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string with format \\"ShortCode\\"",
          "path": [],
          "received": "LONG",
        },
      ],
      "success": false,
    }
  `);
});

it("uses the most specific custom error message for string format extends", () => {
  expect(Codecs.ReadAuthorizedUserId.safeParse("user_123")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected user with read permissions",
          "path": [],
          "received": "user_123",
        },
      ],
      "success": false,
    }
  `);

  expect(Codecs.WriteAuthorizedUserId.safeParse("user_read_123")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected user with write permissions",
          "path": [],
          "received": "user_read_123",
        },
      ],
      "success": false,
    }
  `);
});

it("covers all parent-child errorMessage combinations for string extends", () => {
  expect(Codecs.StringChildNoMsg.safeParse("string-parent-value")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected string with format \\"StringParentNoMsg and StringChildNoMsg\\"",
          "path": [],
          "received": "string-parent-value",
        },
      ],
      "success": false,
    }
  `);

  expect(Codecs.StringParentMsgOnlyChild.safeParse("string-parent-msg-value")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected parent string rule",
          "path": [],
          "received": "string-parent-msg-value",
        },
      ],
      "success": false,
    }
  `);

  expect(Codecs.StringChildMsg.safeParse("string-child-msg-value")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected child string rule",
          "path": [],
          "received": "string-child-msg-value",
        },
      ],
      "success": false,
    }
  `);

  expect(Codecs.StringBothMsgChild.safeParse("string-both-msg-value")).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected child string rule",
          "path": [],
          "received": "string-both-msg-value",
        },
      ],
      "success": false,
    }
  `);
});

it("uses custom error messages for base number formats", () => {
  expect(Codecs.NonInfiniteNumber.safeParse(Infinity)).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected a finite number",
          "path": [],
          "received": Infinity,
        },
      ],
      "success": false,
    }
  `);
});

it("falls back to the default message for object number formats without errorMessage", () => {
  expect(Codecs.NegativeNumber.safeParse(1)).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected number with format \\"NegativeNumber\\"",
          "path": [],
          "received": 1,
        },
      ],
      "success": false,
    }
  `);
});

it("uses the most specific custom error message for number format extends", () => {
  expect(Codecs.NonNegativeNumber.safeParse(-1)).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected a non-negative number",
          "path": [],
          "received": -1,
        },
      ],
      "success": false,
    }
  `);

  expect(Codecs.Rate.safeParse(2)).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected a valid rate",
          "path": [],
          "received": 2,
        },
      ],
      "success": false,
    }
  `);
});

it("covers all parent-child errorMessage combinations for number extends", () => {
  expect(Codecs.NumberChildNoMsg.safeParse(20)).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected number with format \\"NumberParentNoMsg and NumberChildNoMsg\\"",
          "path": [],
          "received": 20,
        },
      ],
      "success": false,
    }
  `);

  expect(Codecs.NumberParentMsgOnlyChild.safeParse(20)).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected parent number rule",
          "path": [],
          "received": 20,
        },
      ],
      "success": false,
    }
  `);

  expect(Codecs.NumberChildMsg.safeParse(20)).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected child number rule",
          "path": [],
          "received": 20,
        },
      ],
      "success": false,
    }
  `);

  expect(Codecs.NumberBothMsgChild.safeParse(20)).toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "message": "expected child number rule",
          "path": [],
          "received": 20,
        },
      ],
      "success": false,
    }
  `);
});

it("still parses valid values", () => {
  expect(Codecs.ValidCurrency.parse("USD")).toBe("USD");
  expect(Codecs.ShortCode.parse("ABC")).toBe("ABC");
  expect(Codecs.WriteAuthorizedUserId.parse("user_read_write_123")).toBe("user_read_write_123");
  expect(Codecs.StringBothMsgChild.parse("string-both-msg-child")).toBe("string-both-msg-child");
  expect(Codecs.NegativeNumber.parse(-1)).toBe(-1);
  expect(Codecs.NumberBothMsgChild.parse(5)).toBe(5);
  expect(Codecs.Rate.parse(0.5)).toBe(0.5);
});
