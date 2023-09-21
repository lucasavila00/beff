import { Ctx } from "@beff/hono";
import { Session, getServerSession } from "next-auth";
import { Octokit } from "octokit";
import { authOptions, prisma } from "../../auth/[...nextauth]/route";
const { createAppAuth } = require("@octokit/auth-app");
export type GithubRepoData = {
  name: string;
  id: number;
  nodeId: string;
  fullName: string;
  ownerLogin: string;
  private: boolean;
};

const getVisibleRepos = async (token: string): Promise<GithubRepoData[]> => {
  const octokit = new Octokit({
    auth: token,
  });

  const visibleRepos = await octokit.rest.repos.listForAuthenticatedUser({});

  const reposData = visibleRepos.data.map((it) => ({
    name: it.name,
    id: it.id,
    nodeId: it.node_id,
    fullName: it.full_name,
    ownerLogin: it.owner.login,
    private: it.private,
  }));

  return reposData;
};

const appOctokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_PRIVATE_KEY,
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
  },
});
type NewProjectResponse = {
  id: string;
};
/* eslint-disable import/no-anonymous-default-export */
export default {
  "/repos": {
    get: async (_c: Ctx): Promise<GithubRepoData[]> => {
      const session = await getServerSession(authOptions);
      const account = await prisma.account.findFirst({
        where: {
          userId: (session as any)?.user_id,
        },
      });
      if (account?.access_token == null) {
        return [];
      }
      return getVisibleRepos(account.access_token);
    },
  },
  "/isAppInstalled": {
    get: async (_c: Ctx, fullName: string): Promise<boolean> => {
      // TODO: check current user can access the full name

      try {
        const install = await appOctokit.rest.apps.getRepoInstallation({
          owner: fullName.split("/")[0],
          repo: fullName.split("/")[1],
        });
        return install.status === 200;
      } catch (e) {
        return false;
      }
    },
  },
  "/project/new": {
    post: async (_c: Ctx, fullName: string): Promise<NewProjectResponse> => {
      return {
        id: "TODO",
      };
    },
  },
};
