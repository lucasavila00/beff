import { Ctx } from "@beff/hono";
import { getServerSession } from "next-auth";
import { Octokit } from "octokit";
import { prisma } from "@/utils/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

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

export const RepoRouter = {
  "/repo": {
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
};
