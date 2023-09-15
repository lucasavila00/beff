// import { Ctx } from "@beff/hono";
import { cors } from "hono/cors";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as wasmIndexBg from "../pkg/index_bg.js";
import wasmMod from "../pkg/index_bg.wasm";

// import {
//   VerifyFirebaseAuthConfig,
//   verifyFirebaseAuth,
//   getFirebaseToken,
// } from "@hono/firebase-auth";
// import { WorkersKVStoreSingle } from "firebase-auth-cloudflare-workers";
// const FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
// const PUBLIC_JWK_CACHE_KEY = "public-jwk-cache-key";

// const config: VerifyFirebaseAuthConfig = {
//   // specify your firebase project ID.
//   projectId: "your-project-id",
//   // this is optional. but required in this mode.
//   keyStoreInitializer: (c) =>
//     WorkersKVStoreSingle.getOrInitialize(
//       PUBLIC_JWK_CACHE_KEY,
//       c.env.PUBLIC_JWK_CACHE_KV
//     ),

//   firebaseEmulatorHost: FIREBASE_AUTH_EMULATOR_HOST,
// };

const doInitWasm = async () => {
  const wasm = await WebAssembly.instantiate(wasmMod, {
    "./index_bg.js": wasmIndexBg,
  }).then((it) => it.exports);
  wasmIndexBg.__wbg_set_wasm(wasm);
  return wasm;
};
let initWasmPromise: Promise<unknown> | null = null;
const initWasm = () => {
  if (initWasmPromise == null) {
    initWasmPromise = doInitWasm();
  }
  return initWasmPromise;
};

const a = JSON.stringify({
  components: {
    responses: {
      DecodeError: {
        content: {
          "application/json": {
            schema: {
              properties: {
                message: {
                  type: "string",
                },
              },
              required: ["message"],
              type: "object",
            },
          },
        },
        description: "Invalid parameters or request body",
      },
      UnexpectedError: {
        content: {
          "application/json": {
            schema: {
              properties: {
                message: {
                  type: "string",
                },
              },
              required: ["message"],
              type: "object",
            },
          },
        },
        description: "Unexpected Error",
      },
    },
    schemas: {},
  },
  info: {
    description:
      "This is an example API router. Adding a comment here adds it to its description.\n\nTitle and version are mandatory on the OpenAPI specification!\n\n\nComments here are added to the description of the API, too.\n",
    title: "Example API",
    version: "1.0.0",
  },
  openapi: "3.1.0",
  paths: {
    "/": {
      get: {
        description:
          "This is an example route. Adding a comment here adds it to its description.\nWe can also add a summary.\n",
        parameters: [],
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  type: "string",
                },
              },
            },
            description: "Successful Operation",
          },
          "422": {
            $ref: "#/components/responses/DecodeError",
          },
          "500": {
            $ref: "#/components/responses/UnexpectedError",
          },
        },
        summary: "Example route",
      },
    },
    "/hello/{name}": {
      get: {
        description:
          "This is an example route. Adding a comment here adds it to its description.\nSummaries ate not mandatory.",
        parameters: [
          {
            description:
              "This is an example path parameter. Adding a comment here adds it to its description.",
            in: "path",
            name: "name",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {},
              },
            },
            description: "Successful Operation",
          },
          "422": {
            $ref: "#/components/responses/DecodeError",
          },
          "500": {
            $ref: "#/components/responses/UnexpectedError",
          },
        },
      },
      post: {
        parameters: [
          {
            in: "path",
            name: "name",
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            description:
              "This is an example query parameter. Adding a comment here adds it to its description.",
            in: "query",
            name: "limit",
            required: true,
            schema: {
              type: "number",
            },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                properties: {
                  message: {
                    type: "string",
                  },
                },
                required: ["message"],
                type: "object",
              },
            },
          },
          description:
            "This is an example request body parameter. Adding a comment here adds it to its description.",
          required: true,
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {},
              },
            },
            description: "Successful Operation",
          },
          "422": {
            $ref: "#/components/responses/DecodeError",
          },
          "500": {
            $ref: "#/components/responses/UnexpectedError",
          },
        },
      },
    },
  },
});

const b = JSON.stringify({
  components: {
    responses: {
      DecodeError: {
        content: {
          "application/json": {
            schema: {
              properties: {
                message: {
                  type: "string",
                },
              },
              required: ["message"],
              type: "object",
            },
          },
        },
        description: "Invalid parameters or request body",
      },
      UnexpectedError: {
        content: {
          "application/json": {
            schema: {
              properties: {
                message: {
                  type: "string",
                },
              },
              required: ["message"],
              type: "object",
            },
          },
        },
        description: "Unexpected Error",
      },
    },
    schemas: {},
  },
  info: {
    description:
      "This is an example API router. Adding a comment here adds it to its description.\n\nTitle and version are mandatory on the OpenAPI specification!\n\n\nComments here are added to the description of the API, too.\n",
    title: "Example API",
    version: "1.0.0",
  },
  openapi: "3.1.0",
  paths: {
    "/": {
      get: {
        description:
          "This is an example route. Adding a comment here adds it to its description.\nWe can also add a summary.\n",
        parameters: [],
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  type: "string",
                },
              },
            },
            description: "Successful Operation",
          },
          "422": {
            $ref: "#/components/responses/DecodeError",
          },
          "500": {
            $ref: "#/components/responses/UnexpectedError",
          },
        },
        summary: "Example route",
      },
    },
    "/hello/{name}": {
      get: {
        description:
          "This is an example route. Adding a comment here adds it to its description.\nSummaries ate not mandatory.",
        parameters: [
          {
            description:
              "This is an example path parameter. Adding a comment here adds it to its description.",
            in: "path",
            name: "name",
            required: true,
            schema: {
              type: "number",
            },
          },
        ],
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {},
              },
            },
            description: "Successful Operation",
          },
          "422": {
            $ref: "#/components/responses/DecodeError",
          },
          "500": {
            $ref: "#/components/responses/UnexpectedError",
          },
        },
      },
      post: {
        parameters: [
          {
            in: "path",
            name: "name",
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            description:
              "This is an example query parameter. Adding a comment here adds it to its description.",
            in: "query",
            name: "limit",
            required: true,
            schema: {
              type: "number",
            },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                properties: {
                  message: {
                    type: "string",
                  },
                },
                required: ["message"],
                type: "object",
              },
            },
          },
          description:
            "This is an example request body parameter. Adding a comment here adds it to its description.",
          required: true,
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {},
              },
            },
            description: "Successful Operation",
          },
          "422": {
            $ref: "#/components/responses/DecodeError",
          },
          "500": {
            $ref: "#/components/responses/UnexpectedError",
          },
        },
      },
    },
  },
});
export default {
  "/*": {
    use: [
      cors(),
      // verifyFirebaseAuth(config)
    ],
  },
  "/hello": {
    get: async () =>
      // _c: Ctx
      {
        // const token = getFirebaseToken(c.hono);
        // console.log(token);
        await initWasm();
        return {
          message: wasmIndexBg.compare_schemas(a, b),
        };
      },
  },
};
