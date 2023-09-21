import { Ctx } from "@beff/hono";
import { Session, getServerSession } from "next-auth";
import { Octokit } from "octokit";
import { authOptions, prisma } from "../../auth/[...nextauth]/route";

export type GithubRepoData = {
  name: string;
  id: number;
  node_id: string;
  full_name: string;
  owner_login: string;
  private: boolean;
};

const getVisibleRepos = async (token: string): Promise<GithubRepoData[]> => {
  const octokit = new Octokit({
    auth: token,
  });

  // list installations

  const visibleRepos = await octokit.rest.repos.listForAuthenticatedUser({});

  //   console.log(visibleRepos.data[0]);

  const reposData = visibleRepos.data.map((it) => ({
    name: it.name,
    id: it.id,
    node_id: it.node_id,
    full_name: it.full_name,
    owner_login: it.owner.login,
    private: it.private,
  }));

  return reposData;
};

/* eslint-disable import/no-anonymous-default-export */
export default {
  "/repos": {
    get: async (_c: Ctx): Promise<GithubRepoData[]> => {
      const session = await getServerSession(authOptions);
      const account = await prisma.account.findFirstOrThrow({
        where: {
          userId: (session as any)?.user_id,
        },
      });
      if (account.access_token == null) {
        return [];
      }
      return getVisibleRepos(account.access_token);
    },
  },
};
