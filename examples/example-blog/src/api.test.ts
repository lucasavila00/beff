import type { Post } from "./model";
import { api as app } from "./api";
import { buildHonoTestClient } from "@beff/hono";
import { meta } from "./gen/client";
import type router from "./router";

const env = getMiniflareBindings();

const client = buildHonoTestClient<typeof router>(meta, app, env);

describe("Root", () => {
  it("GET /", async () => {
    expect(await client["/"].get()).toEqual({ message: "Hello" });
  });
});

describe("Blog API", () => {
  test("List", async () => {
    const body = await client["/posts"].get();
    expect(body["posts"]).not.toBeUndefined();
    expect(body["posts"].length).toBe(0);
  });

  let newPostId = "";

  test("CRUD", async () => {
    // POST /posts
    let body = await client["/posts"].post({
      title: "Morning",
      body: "Good Morning",
    });

    if (!body.ok) {
      throw new Error("Can not create new post");
    }
    const newPost = body["post"];
    expect(newPost.title).toBe("Morning");
    expect(newPost.body).toBe("Good Morning");
    newPostId = newPost.id;

    // GET /posts
    const body2 = await client["/posts"].get();
    expect(body2["posts"]).not.toBeUndefined();
    expect(body2["posts"].length).toBe(1);

    // GET /posts/:id
    const body22 = await client["/posts/{id}"].get(newPostId);
    if (!body22.ok) {
      throw new Error("Can not create new post");
    }
    let post = body22["post"] as Post;
    expect(post.id).toBe(newPostId);
    expect(post.title).toBe("Morning");

    // PUT /posts/:id
    let body3 = await client["/posts/{id}"].put(newPostId, {
      title: "Night",
      body: "Good Night",
    });
    expect(body3["ok"]).toBeTruthy();

    // GET /posts/:id'
    const body23 = await client["/posts/{id}"].get(newPostId);
    if (!body23.ok) {
      throw new Error("Can not create new post");
    }
    let post2 = body23["post"] as Post;
    expect(post2.title).toBe("Night");
    expect(post2.body).toBe("Good Night");

    // DELETE /posts/:id
    const body4 = await client["/posts/{id}"].delete(newPostId);
    expect(body4["ok"]).toBeTruthy();

    // GET /posts/:id
    const body24 = await client["/posts/{id}"].get(newPostId);
    expect(body24["ok"]).toBeFalsy();
  });
});
