import { it, expect } from "vitest";
import { buildHonoApp, buildHonoLocalClient } from "@beff/hono";
import router from "../router";
import generated from "../bff-generated/router";
import generatedClient from "../bff-generated/router";

const app = buildHonoApp({ router, generated });
const beff = buildHonoLocalClient<typeof router>({
  generated: generatedClient,
  app,
});

it("date", async () => {
  await expect(
    beff["/date"].post(
      // @ts-expect-error
      { a: "asd" }
    )
  ).rejects.toMatchInlineSnapshot(
    '[HTTPException: #0 (b.a) expected ISO8061 date, received: "asd"]'
  );

  expect(
    await beff["/date"].post({ a: new Date("2023-09-23T02:49:43.980Z") })
  ).toMatchInlineSnapshot("2023-09-23T02:49:43.980Z");

  expect(
    (
      await beff["/date"].post({ a: new Date("2023-09-23T02:49:43.980Z") })
    ).toISOString()
  ).toMatchInlineSnapshot('"2023-09-23T02:49:43.980Z"');
  expect(
    await beff["/date"].get(new Date("2023-09-23T02:49:43.980Z"))
  ).toMatchInlineSnapshot("2023-09-23T02:49:43.980Z");
  expect(
    (
      await beff["/date"].get(new Date("2023-09-23T02:49:43.980Z"))
    ).toISOString()
  ).toMatchInlineSnapshot('"2023-09-23T02:49:43.980Z"');
});

it("bigint", async () => {
  await expect(
    beff["/bigint"].post(
      // @ts-expect-error
      { a: "asd" }
    )
  ).rejects.toMatchInlineSnapshot(
    '[HTTPException: #0 (b.a) expected bigint, received: "asd"]'
  );

  expect(await beff["/bigint"].post({ a: 1n })).toMatchInlineSnapshot("1n");
  expect((await beff["/bigint"].post({ a: 1n })) + 2n).toMatchInlineSnapshot(
    "3n"
  );
  expect(await beff["/bigint"].get(1n)).toMatchInlineSnapshot("1n");
  expect((await beff["/bigint"].get(1n)) + 2n).toMatchInlineSnapshot("3n");
});

it("intersection", async () => {
  await expect(
    beff["/intersection"].post(
      // @ts-expect-error
      {
        a: "",
      }
    )
  ).rejects.toMatchInlineSnapshot(
    "[HTTPException: #0 (p.b) expected number, received: undefined]"
  );

  const v = {
    a: "a",
    b: 1,
  };
  expect(await beff["/intersection"].post(v)).toMatchInlineSnapshot(`
    {
      "a": "a",
      "b": 1,
    }
  `);
  expect((await beff["/intersection"].post(v)).b).toMatchInlineSnapshot("1");
  expect(await beff["/intersection"].get("a")).toMatchInlineSnapshot('"a"');
  expect(await beff["/intersection"].get("a")).toMatchInlineSnapshot('"a"');
});

it("tuple", async () => {
  await expect(
    beff["/tuple1"].post(
      // @ts-expect-error
      [1]
    )
  ).rejects.toMatchInlineSnapshot(
    "[HTTPException: #0 (b[1]) expected number, received: undefined]"
  );

  expect(await beff["/tuple1"].post([1, 2])).toMatchInlineSnapshot(`
    [
      1,
      2,
    ]
  `);
  expect(await beff["/tuple1"].post([1, 2, "3", "4", "5"]))
    .toMatchInlineSnapshot(`
      [
        1,
        2,
        "3",
        "4",
        "5",
      ]
    `);
});

it("tuple2", async () => {
  expect(await beff["/tuple2"].post([1, 2])).toMatchInlineSnapshot(`
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
  ).rejects.toMatchInlineSnapshot(
    "[HTTPException: #0 (b) tuple has too many items, received: Array]"
  );
});

it("undefined", async () => {
  await expect(
    beff["/undefined"].post(
      // @ts-expect-error
      { a: "undefined" }
    )
  ).rejects.toMatchInlineSnapshot(
    "[HTTPException: #0 (a) expected null, received: Object]"
  );

  expect(await beff["/undefined"].post(undefined)).toMatchInlineSnapshot(
    "null"
  );
});

it("union", async () => {
  await expect(
    beff["/union"].post(
      // @ts-expect-error
      { a: "undefined" }
    )
  ).rejects.toMatchInlineSnapshot(
    '[HTTPException: #0 (a) expected one of, received: Object]'
  );
  await expect(
    beff["/union"].post(
      // @ts-expect-error
      "c"
    )
  ).rejects.toMatchInlineSnapshot(
    '[HTTPException: #0 (a) expected one of, received: "c"]'
  );
  expect(await beff["/union"].post("a")).toMatchInlineSnapshot('"a"');
});
