import { Layout, getVisibleRepos } from "@/components/layout";
import {
  Avatar,
  Blockquote,
  Box,
  Button,
  Heading,
  Link as RadixLink,
  Table,
  Text,
} from "@radix-ui/themes";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { FC } from "react";
import { GithubRepoData } from "@/components/repos-dropdown";
import Link from "next/link";

const RepositoriesByOwner: FC<{
  ownerName: string;
  repositories: GithubRepoData[];
}> = ({ ownerName, repositories }) => {
  return (
    <>
      <Box mb="6">
        <Heading>{ownerName}</Heading>
      </Box>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Repository</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Private</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {repositories.map((it) => (
            <Table.Row key={it.node_id}>
              <Table.RowHeaderCell>
                <RadixLink asChild>
                  <Link href={`/repo/${it.node_id}`}>{it.name}</Link>
                </RadixLink>
              </Table.RowHeaderCell>
              <Table.Cell>
                <Avatar
                  color={it.private ? "red" : "gray"}
                  fallback={it.private ? "Y" : "N"}
                  size="1"
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </>
  );
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  const repos = await getVisibleRepos(session);

  const groupedByOwner = repos.reduce((acc, it) => {
    const owner = it.owner_login;
    if (acc[owner] == null) {
      acc[owner] = [];
    }
    acc[owner].push(it);
    return acc;
  }, {} as Record<string, typeof repos>);

  return (
    <>
      <Layout currentRepoName={null} session={session} repos={repos}>
        <>
          <Box className="mx-auto max-w-4xl">
            {Object.entries(groupedByOwner).map(([ownerName, repositories]) => (
              <Box key={ownerName} className="mb-24">
                <RepositoriesByOwner
                  ownerName={ownerName}
                  repositories={repositories}
                />
              </Box>
            ))}
          </Box>
        </>
      </Layout>
    </>
  );
}
