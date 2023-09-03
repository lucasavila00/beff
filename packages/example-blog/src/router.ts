import { cors } from "hono/cors";
import * as model from "./model";
import { Bindings } from "./bindings";
import { prettyJSON } from "hono/pretty-json";
import { Ctx as BffCtx } from "bff-hono";

type Ctx = BffCtx<{}, { Bindings: Bindings }>;
export default {
  ["*"]: { use: [prettyJSON()] },
  ["/posts/*"]: { use: [cors()] },
  ["/"]: {
    get: async (): Promise<{ message: string }> => {
      return { message: "Hello" };
    },
  },
  ["/posts"]: {
    get: async (c: Ctx): Promise<{ posts: model.Post[]; ok: boolean }> => {
      const posts = await model.getPosts(c.hono.env.BLOG_EXAMPLE);
      return { posts: posts, ok: true };
    },
    post: async (
      c: Ctx,
      param: model.Param
    ): Promise<
      { ok: true; post: model.Post } | { ok: false; error: string }
    > => {
      const newPost = await model.createPost(c.hono.env.BLOG_EXAMPLE, param);
      if (!newPost) {
        return { error: "Can not create new post", ok: false };
      }
      return { post: newPost, ok: true };
    },
  },
  ["/posts/{id}"]: {
    get: async (
      c: Ctx,
      id: string
    ): Promise<
      { ok: true; post: model.Post } | { ok: false; error: string }
    > => {
      const post = await model.getPost(c.hono.env.BLOG_EXAMPLE, id);
      if (!post) {
        return { error: "Not Found", ok: false };
      }
      return { post: post, ok: true };
    },
    put: async (
      c: Ctx,
      id: string,
      param: model.Param
    ): Promise<{ ok: boolean }> => {
      const post = await model.getPost(c.hono.env.BLOG_EXAMPLE, id);
      if (!post) {
        return { ok: false };
      }
      const success = await model.updatePost(
        c.hono.env.BLOG_EXAMPLE,
        id,
        param
      );
      return { ok: success };
    },
    delete: async (c: Ctx, id: string): Promise<{ ok: boolean }> => {
      const post = await model.getPost(c.hono.env.BLOG_EXAMPLE, id);
      if (!post) {
        return { ok: false };
      }
      const success = await model.deletePost(c.hono.env.BLOG_EXAMPLE, id);
      return { ok: success };
    },
  },
};
