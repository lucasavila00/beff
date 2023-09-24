import { beffLocalClient } from "@/app/api/beff/[...beff]/router-app";
import { ProjectsBreadcrumbs } from "@/components/projects-breadcrumbs";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import { Box, Flex, Heading, Link, Table } from "@radix-ui/themes";
import NextLink from "next/link";
import { format } from "timeago.js";

export default async function Branches({ params }: { params: { id: string } }) {
  const versions = await beffLocalClient["/project/{id}/version"].get(params.id);
  return (
    <ProjectsBreadcrumbs
      projectId={params.id}
      extra={[
        {
          href: `/project/${params.id}/version`,
          text: "Versions",
        },
      ]}
    >
      <>
        <Box className="mx-auto max-w-2xl" pt="8">
          <Heading color="gray" mb="6">
            Versions
          </Heading>
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Version</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Created At</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {versions.map((v) => {
                return (
                  <Table.Row key={v.id}>
                    <Table.RowHeaderCell>
                      <Link asChild>
                        <NextLink href={`/project/${params.id}/version/${v.id}`}>
                          <Flex gap="1" align="center">
                            {v.version}
                          </Flex>
                        </NextLink>
                      </Link>
                    </Table.RowHeaderCell>
                    <Table.Cell>
                      <Flex align="center" gap="1">
                        <CheckCircledIcon color="green" />
                        Compatible
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>{format(v.updatedAt)}</Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Box>
      </>
    </ProjectsBreadcrumbs>
  );
}
