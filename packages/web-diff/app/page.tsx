import { Layout, getVisibleRepos } from "@/components/layout";
import {
  Avatar,
  Blockquote,
  Box,
  Button,
  Card,
  Flex,
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
import Image from "next/image";
import wfy from "@/components/undraw/waiting_for_you.svg";
import { NewProjectButton } from "@/components/new-project";

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

const ProjectTable = () => {
  return (
    <>
      <Flex justify="between">
        <Heading color="gray" mb="6">
          Projects
        </Heading>
        <NewProjectButton />
      </Flex>
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Full name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Group</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          <Table.Row>
            <Table.RowHeaderCell>Danilo Sousa</Table.RowHeaderCell>
            <Table.Cell>danilo@example.com</Table.Cell>
            <Table.Cell>Developer</Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.RowHeaderCell>Zahra Ambessa</Table.RowHeaderCell>
            <Table.Cell>zahra@example.com</Table.Cell>
            <Table.Cell>Admin</Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.RowHeaderCell>Jasper Eriksson</Table.RowHeaderCell>
            <Table.Cell>jasper@example.com</Table.Cell>
            <Table.Cell>Developer</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </>
  );
};

const CreateFirstProject = () => {
  return (
    <Card className="!bg-gray-1 dark:!bg-gray-3">
      <Flex p="4" align="center" direction="column">
        <Image className="w-56 h-56 mb-4" src={wfy} alt="" />
        <Heading mb="4">Create your first project</Heading>
        <NewProjectButton />
      </Flex>
    </Card>
  );
};
export default async function Home() {
  const session = await getServerSession(authOptions);
  // console.log(session);
  // const repos = await getVisibleRepos(session);

  // const groupedByOwner = repos.reduce((acc, it) => {
  //   const owner = it.owner_login;
  //   if (acc[owner] == null) {
  //     acc[owner] = [];
  //   }
  //   acc[owner].push(it);
  //   return acc;
  // }, {} as Record<string, typeof repos>);

  return (
    <>
      <Layout session={session}>
        <Box className="mx-auto max-w-4xl" pt="8">
          <CreateFirstProject />
        </Box>
      </Layout>
    </>
  );
}
