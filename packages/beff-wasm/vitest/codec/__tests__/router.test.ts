import { test, expect } from "vitest";
import { buildHonoApp, buildHonoLocalClient } from "@beff/hono";
import router from "../router";
import generated from "../bff-generated/router";
import generatedClient from "../bff-generated/router";

const app = buildHonoApp({ router, generated });
const beff = buildHonoLocalClient<typeof router>({
  generated: generatedClient,
  app,
});

test("either", async () => {
  await expect(
    beff["/either"].post(
      // @ts-expect-error
      { a: "asd" }
    )
  ).rejects.toMatchInlineSnapshot('[HTTPException: #0 (b.a) expected one of, received: "asd"]');

  await expect(
    beff["/either"].post({
      a: {
        _tag: "Left",
        left: "asd",
      },
    })
  ).resolves.toMatchInlineSnapshot(`
    {
      "_tag": "Left",
      "left": "asd",
    }
  `);
});
test("either2", async () => {
  await expect(
    beff["/either2"].post(
      // @ts-expect-error
      { a: "asd" }
    )
  ).rejects.toMatchInlineSnapshot('[HTTPException: #0 (b.a) expected one of, received: "asd"]');

  await expect(
    beff["/either2"].post({
      a: {
        _tag: "Left",
        left: "asd",
      },
    })
  ).resolves.toMatchInlineSnapshot(`
    {
      "_tag": "Left",
      "left": "asd",
    }
  `);
});

test("export default is as const", async () => {
  await expect(
    beff["/exp_default"].post(
      //@ts-expect-error
      "b"
    )
  ).rejects.toMatchInlineSnapshot('[HTTPException: #0 (a) expected "a", received: "b"]');

  await expect(beff["/exp_default"].post("a")).resolves.toMatchInlineSnapshot('"a"');
});

test("date", async () => {
  await expect(
    beff["/date"].post(
      // @ts-expect-error
      { a: "asd" }
    )
  ).rejects.toMatchInlineSnapshot('[HTTPException: #0 (b.a) expected ISO8061 date, received: "asd"]');

  await expect(
    beff["/date"].post({ a: new Date("2023-09-23T02:49:43.980Z") })
  ).resolves.toMatchInlineSnapshot("2023-09-23T02:49:43.980Z");

  expect(
    (await beff["/date"].post({ a: new Date("2023-09-23T02:49:43.980Z") })).toISOString()
  ).toMatchInlineSnapshot('"2023-09-23T02:49:43.980Z"');
  await expect(beff["/date"].get(new Date("2023-09-23T02:49:43.980Z"))).resolves.toMatchInlineSnapshot(
    "2023-09-23T02:49:43.980Z"
  );
  expect((await beff["/date"].get(new Date("2023-09-23T02:49:43.980Z"))).toISOString()).toMatchInlineSnapshot(
    '"2023-09-23T02:49:43.980Z"'
  );
});

test("bigint", async () => {
  await expect(
    beff["/bigint"].post(
      // @ts-expect-error
      { a: "asd" }
    )
  ).rejects.toMatchInlineSnapshot('[HTTPException: #0 (b.a) expected bigint, received: "asd"]');

  await expect(beff["/bigint"].post({ a: 1n })).resolves.toMatchInlineSnapshot("1n");
  expect((await beff["/bigint"].post({ a: 1n })) + 2n).toMatchInlineSnapshot("3n");
  await expect(beff["/bigint"].get(1n)).resolves.toMatchInlineSnapshot("1n");
  expect((await beff["/bigint"].get(1n)) + 2n).toMatchInlineSnapshot("3n");
});

test("intersection", async () => {
  await expect(
    beff["/intersection"].post(
      // @ts-expect-error
      {
        a: "",
      }
    )
  ).rejects.toMatchInlineSnapshot("[HTTPException: #0 (p.b) expected number, received: undefined]");

  const v = {
    a: "a",
    b: 1,
  };
  await expect(beff["/intersection"].post(v)).resolves.toMatchInlineSnapshot(`
    {
      "a": "a",
      "b": 1,
    }
  `);
  expect((await beff["/intersection"].post(v)).b).toMatchInlineSnapshot("1");
  await expect(beff["/intersection"].get("a")).resolves.toMatchInlineSnapshot('"a"');
  await expect(beff["/intersection"].get("a")).resolves.toMatchInlineSnapshot('"a"');
});

test("tuple", async () => {
  await expect(
    beff["/tuple1"].post(
      // @ts-expect-error
      [1]
    )
  ).rejects.toMatchInlineSnapshot("[HTTPException: #0 (b[1]) expected number, received: undefined]");

  await expect(beff["/tuple1"].post([1, 2])).resolves.toMatchInlineSnapshot(`
    [
      1,
      2,
    ]
  `);
  await expect(beff["/tuple1"].post([1, 2, "3", "4", "5"])).resolves.toMatchInlineSnapshot(`
      [
        1,
        2,
        "3",
        "4",
        "5",
      ]
    `);
});

test("tuple2", async () => {
  await expect(beff["/tuple2"].post([1, 2])).resolves.toMatchInlineSnapshot(`
    [
      1,
      2,
    ]
  `);

  await expect(
    beff["/tuple2"].post(
      // @ts-expect-error
      [1, 2, "3", "4", "5"]
    )
  ).rejects.toMatchInlineSnapshot("[HTTPException: #0 (b) tuple has too many items, received: Array]");
});

test("undefined", async () => {
  await expect(
    beff["/undefined"].post(
      // @ts-expect-error
      { a: "undefined" }
    )
  ).rejects.toMatchInlineSnapshot("[HTTPException: #0 (a) expected null, received: Object]");

  await expect(beff["/undefined"].post(undefined)).resolves.toMatchInlineSnapshot("null");
});
test("any_array", async () => {
  await expect(
    beff["/any_array"].post(
      // @ts-expect-error
      { a: "undefined" }
    )
  ).rejects.toMatchInlineSnapshot("[HTTPException: #0 (a) expected array, received: Object]");

  await expect(beff["/any_array"].post([1, 2, 3])).resolves.toMatchInlineSnapshot(`
    [
      1,
      2,
      3,
    ]
  `);
});

test("union", async () => {
  await expect(
    beff["/union"].post(
      // @ts-expect-error
      { a: "undefined" }
    )
  ).rejects.toMatchInlineSnapshot("[HTTPException: #0 (a) expected one of, received: Object]");
  await expect(
    beff["/union"].post(
      // @ts-expect-error
      "c"
    )
  ).rejects.toMatchInlineSnapshot('[HTTPException: #0 (a) expected one of, received: "c"]');
  await expect(beff["/union"].post("a")).resolves.toMatchInlineSnapshot('"a"');
});
