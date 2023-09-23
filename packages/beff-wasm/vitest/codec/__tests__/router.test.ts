import { it, expect } from "vitest";
import { buildHonoApp, buildHonoTestClient } from "@beff/hono";
import router from "../router";
import generated from "../bff-generated/router";
import generatedClient from "../bff-generated/router";

const app = buildHonoApp({ router, generated });
const beff = buildHonoTestClient<typeof router>({
  generated: generatedClient,
  app,
});

it("date", async () => {
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
  expect(await beff["/bigint"].post({ a: 1n })).toMatchInlineSnapshot("1n");
  expect((await beff["/bigint"].post({ a: 1n })) + 2n).toMatchInlineSnapshot(
    "3n"
  );
  expect(await beff["/bigint"].get(1n)).toMatchInlineSnapshot("1n");
  expect((await beff["/bigint"].get(1n)) + 2n).toMatchInlineSnapshot("3n");
});

it("intersection", async () => {
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

  // await expect(
  //   beff["/tuple2"].post(
  //     // @ts-expect-error
  //     [1, 2, "3", "4", "5"]
  //   )
  // ).rejects.toMatchInlineSnapshot('[Error: tuple has too many items]');
});
