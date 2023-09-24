import { Hono } from "hono";
import { routerApp } from "../../../../beff/router-app";

const app = new Hono().basePath("/api/beff");

app.route("/", routerApp);

const handler = (request: Request) => app.fetch(request);

export {
  handler as DELETE,
  handler as GET,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
