import { FC } from "react";
import { Flex, Text, Button, Blockquote, Box } from "@radix-ui/themes";
import { CaretDownIcon } from "@radix-ui/react-icons";
import { UserButton } from "@/components/user-button";
import { Session, getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Octokit, App } from "octokit";
import { GithubRepoData, ReposDropdown } from "./repos-dropdown";

const ConnectedUserButton: FC<{ session: Session | null }> = async ({
  session,
}) => {
  if (session == null) {
    return <></>;
  }
  const name = session.user?.name ?? "";
  const image = session.user?.image ?? "";
  return <UserButton name={name} image={image} />;
};

export const getVisibleRepos = async (
  session: Session | null
): Promise<GithubRepoData[]> => {
  const token = (session as any)?.accessToken;

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
const NavBar: FC<{
  session: Session | null;
  repos: GithubRepoData[];
  currentRepoName: string | null;
}> = ({ session, repos, currentRepoName }) => {
  const height = "8";
  return (
    <>
      <Flex
        width="100%"
        position="fixed"
        height={height}
        className="bg-panel border-b border-gray-4"
        align="center"
        justify="between"
      >
        <Box pl="3">
          <Text size="3" weight="bold">
            Diff
          </Text>
        </Box>
        <Flex gap="4">
          {currentRepoName && (
            <ReposDropdown repositories={repos}>
              <Button variant="ghost">
                {currentRepoName}
                <CaretDownIcon width="16" height="16" />
              </Button>
            </ReposDropdown>
          )}
        </Flex>
        <Box pr="2">
          <ConnectedUserButton session={session} />
        </Box>
      </Flex>
      <Box height={height} />
    </>
  );
};

export const Layout: FC<{
  children: React.ReactNode;
  currentRepoName: string | null;
  repos: GithubRepoData[];
  session: Session | null;
}> = async ({ children, currentRepoName, repos, session }) => {
  return (
    <>
      <NavBar
        currentRepoName={currentRepoName}
        session={session}
        repos={repos}
      />
      <Box
        p={{
          xs: "2",
          sm: "4",
          md: "8",
        }}
      >
        {children}
      </Box>
    </>
  );
};
