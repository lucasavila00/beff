import { Ctx } from "@beff/hono";
import { cors } from "hono/cors";
import { compare_schemas, MdResponse } from "./compare-schemas";
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

export default {
  "/*": {
    use: [
      cors(),
      // verifyFirebaseAuth(config)
    ],
  },
  "/compare_schemas": {
    post: async (
      _c: Ctx,
      data: {
        from: string;
        to: string;
      }
    ): Promise<Array<MdResponse>> => {
      const { from, to } = data;
      return compare_schemas(from, to);
    },
  },
};
