import { InstallationRouter } from "./routers/installation";
import { ProjectRouter } from "./routers/project";
import { RepoRouter } from "./routers/repo";

const Router = {
  ...InstallationRouter,
  ...RepoRouter,
  ...ProjectRouter,
};

export default Router;
