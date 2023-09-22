export const initialText = `/**
* @title My API
* @version 1.0.0
* This is a sample server. Try changing me.
*/
export default {
 "/": {
   /**
    * @summary This is the summary or description of the endpoint
    * You can add its description here.
    */
   get: (c: Ctx, query_parameter: number) => {
     return { Hello: "World" };
   },
   post: (c: Ctx, requestBody: { a: string }) => {
     return { ok: true };
   },
 },
 "/items/{item_id}": {
   get: (
     c: Ctx,
     /**
      * This is a description of a parameter.
      */
     item_id: string,
     q?: string
   ) => {
     return { item_id, q };
   },
 },
};
















































// Context must be imported from the runtime, ie: import { Ctx } from "@beff/hono";
// but this demo does not support imports or dependencies.
type Ctx = any;
`;
