import { expect, it } from "vitest";
import routerGenerated from "../src/generated/router";
it("works", () => {
  const schema = routerGenerated.schema;
  expect(JSON.stringify(schema, null, 2)).toMatchFileSnapshot("./oas.json");
});
