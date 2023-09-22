import { Ctx } from "@beff/hono";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";

type InstallationStatus = "installed" | "unknown";
const appOctokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_PRIVATE_KEY,
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
  },
});

export const InstallationRouter = {
  "/installation/status": {
    get: async (_c: Ctx, fullName: string): Promise<InstallationStatus> => {
      try {
        const install = await appOctokit.rest.apps.getRepoInstallation({
          owner: fullName.split("/")[0],
          repo: fullName.split("/")[1],
        });
        return install.status === 200 ? "installed" : "unknown";
      } catch (e) {
        return "unknown";
      }
    },
  },
};
