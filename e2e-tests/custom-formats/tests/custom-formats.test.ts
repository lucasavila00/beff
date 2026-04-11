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

it("still parses valid values", () => {
  expect(Codecs.ValidCurrency.parse("USD")).toBe("USD");
  expect(Codecs.WriteAuthorizedUserId.parse("user_read_write_123")).toBe("user_read_write_123");
  expect(Codecs.Rate.parse(0.5)).toBe(0.5);
});
