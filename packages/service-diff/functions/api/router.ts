import { Ctx } from "@beff/hono";
import { cors } from "hono/cors";
import { compare_schemas, MdResponse } from "./compare-schemas";
import { ISO8061 } from "./parser";
// const todo = <T>(): T => {
//   throw new Error("TODO");
// };

type SchemaVersion = {
  version: string;
  date: ISO8061;
};
type SchemaOverview = {
  id: string;
  title: string;
  openApiSchemaUrl: string;
  lastVersion: string;
  lastVersionDateTime: ISO8061;
};

type SchemaDetails = SchemaOverview & {
  versions: SchemaVersion[];
};

export default {
  "/*": {
    use: [
      cors(),
      // verifyFirebaseAuth(config)
    ],
  },
  "/schema": {
    get: async (): Promise<SchemaOverview[]> => {
      return [
        {
          id: "a",
          openApiSchemaUrl: "https://example.com/a/schema.json",
          title: "schema a",
          lastVersion: "1.0.0",
          lastVersionDateTime: ISO8061.parse("2021-01-01T00:00:00Z"),
        },
        {
          id: "b",
          openApiSchemaUrl: "https://example.com/b/schema.json",
          title: "b schema",
          lastVersion: "1.0.0",
          lastVersionDateTime: ISO8061.parse("2021-01-01T00:00:00Z"),
        },
      ];
    },
  },
  "/schema/{id}": {
    get: async (_c: Ctx, id: string): Promise<SchemaDetails> => {
      return {
        id,
        openApiSchemaUrl: "https://example.com/a/schema.json",
        title: "schema a",
        lastVersion: "1.0.0",
        lastVersionDateTime: ISO8061.parse("2021-01-01T00:00:00Z"),
        versions: [],
      };
    },
  },
  "/compare_schemas": {
    post: async (
      _c: Ctx,
      data: {
        from: string;
        to: string;
      }
    ): Promise<MdResponse[]> => {
      const { from, to } = data;
      return compare_schemas(from, to);
    },
  },
};
