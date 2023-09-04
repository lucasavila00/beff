import { Ctx } from "@beff/hono";

type HelloResponse = {
  message: string;
};

/**
 * This is an example API router. Adding a comment here adds it to its description.
 *
 * Title and version are mandatory on the OpenAPI specification!
 *
 * @version 1.0.0
 * @title Example API
 *
 * Comments here are added to the description of the API, too.
 */
export default {
  // comments on the pattern are ignored
  "/": {
    /**
     * This is an example route. Adding a comment here adds it to its description.
     * We can also add a summary.
     * @summary Example route
     */
    get: async (c: Ctx): Promise<string> => "ok",
  },
  "/hello/{name}": {
    /**
     * This is an example route. Adding a comment here adds it to its description.
     * Summaries ate not mandatory.
     */
    get: async (
      c: Ctx,
      /**
       * This is an example path parameter. Adding a comment here adds it to its description.
       */
      name: string
    ): Promise<HelloResponse> => {
      return {
        message: `Hello ${name}!`,
      };
    },
    post: async (
      c: Ctx,
      name: string,
      /**
       * This is an example request body parameter. Adding a comment here adds it to its description.
       */
      body: HelloResponse,
      /**
       * This is an example query parameter. Adding a comment here adds it to its description.
       */
      limit: number
    ): Promise<HelloResponse> => {
      return body;
    },
  },
};
