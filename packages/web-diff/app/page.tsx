import { BeffProject } from "@/beff/routers/project";
import { BreadCrumbs } from "@/components/breadcrumbs";
import { NewProjectButton } from "@/components/new-project";
import wfy from "@/components/undraw/waiting_for_you.svg";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Box, Card, Flex, Heading, Link, Table } from "@radix-ui/themes";
import Image from "next/image";
import NextLink from "next/link";
import { FC } from "react";
import { format } from "timeago.js";
import { beffLocalClient } from "../beff/router-app";
const ProjectTable: FC<{ projects: BeffProject[] }> = ({ projects }) => {
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
            <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Updated At</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {projects.map((project) => {
            return (
              <Table.Row key={project.id}>
                <Table.RowHeaderCell>
                  <Link asChild>
                    <NextLink href={`/project/${project.id}`}>
                      <Flex gap="1" align="center">
                        <GitHubLogoIcon color="gray" />
                        {project.fullName}
                      </Flex>
                    </NextLink>
                  </Link>
                </Table.RowHeaderCell>
                <Table.Cell>{format(project.updatedAt)}</Table.Cell>
              </Table.Row>
            );
          })}
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
  const projects = await beffLocalClient["/project"].get();
  return (
    <>
      <BreadCrumbs crumbs={[]}>
        <Box className="mx-auto max-w-2xl" pt="8">
          {projects.length == 0 ? <CreateFirstProject /> : <ProjectTable projects={projects} />}
        </Box>
      </BreadCrumbs>
    </>
  );
}
