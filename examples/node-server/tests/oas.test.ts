import { expect, it } from "vitest";
import routerGenerated from "../src/generated/router";
it("snapshot of open api schema", () => {
  expect(JSON.stringify(routerGenerated.schema, null, 2)).toMatchFileSnapshot(
    "./oas.json"
  );
});
