import { beffLocalClient } from "@/beff/router-app";
import { ProjectVersion } from "@/beff/routers/project";
import { CompareSchemaVersion } from "@/components/compare-schema-version";
import { ProjectsBreadcrumbs } from "@/components/projects-breadcrumbs";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import { Box, Button, Card, Flex, Heading, Link, Select, Table } from "@radix-ui/themes";
import NextLink from "next/link";
import { FC } from "react";
import { format } from "timeago.js";
import wfy from "@/components/undraw/waiting_for_you.svg";
import Image from "next/image";
import { OpenDocsButton } from "@/components/open-docs-button";
import { getVersionLabel } from "@/utils/helpers";
import { Links } from "@/utils/route-links";

const CompatibilityStatus: FC<{
  curr: ProjectVersion;
  prev: ProjectVersion;
}> = ({ prev, curr }) => {
  if (prev == null) {
    return <></>;
  }
  return (
    <NextLink
      href={Links["/project/{projectId}/version/{versionId}/compare/{oldVersionId}"](
        curr.projectId,
        curr.id,
        prev.id
      )}
    >
      <Button variant="ghost" color="gray">
        <Flex align="center" gap="1">
          <CheckCircledIcon color="green" />
          Compatible
        </Flex>
      </Button>
    </NextLink>
  );
};

const VersionsTable: FC<{ versions: ProjectVersion[]; projectId: string }> = ({ versions, projectId }) => {
  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Version</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Created At</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Compare</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {versions.map((v, idx, all) => {
          const prev = all[idx + 1];
          const label = getVersionLabel(v);
          return (
            <Table.Row key={v.id} align="center">
              <Table.RowHeaderCell>
                <Link asChild>
                  <NextLink href={Links["/project/{projectId}/version/{versionId}"](projectId, v.id)}>
                    <Flex gap="1" align="center">
                      {label}
                    </Flex>
                  </NextLink>
                </Link>
              </Table.RowHeaderCell>
              <Table.Cell>{format(v.createdAt)}</Table.Cell>
              <Table.Cell>
                <CompatibilityStatus curr={v} prev={prev} />
              </Table.Cell>
              <Table.Cell>
                <CompareSchemaVersion versions={versions.filter((it) => it != v)} />
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
};

const EmptyVersions = () => {
  return (
    <Card className="!bg-gray-1 dark:!bg-gray-3">
      <Flex p="4" align="center" direction="column">
        <Image className="w-56 h-56 mb-4" src={wfy} alt="" />
        <Heading mb="4">No versions yet</Heading>
        <OpenDocsButton />
      </Flex>
    </Card>
  );
};

export default async function Branches({ params }: { params: { projectId: string } }) {
  const versions = await beffLocalClient["/project/{projectId}/version"].get(params.projectId);
  return (
    <ProjectsBreadcrumbs
      projectId={params.projectId}
      extra={[
        {
          href: Links["/project/{projectId}/version"](params.projectId),
          text: "Versions",
        },
      ]}
    >
      <>
        <Box className="mx-auto max-w-2xl" pt="8">
          <Heading color="gray" mb="6">
            Versions
          </Heading>
          {versions.length == 0 ? (
            <EmptyVersions />
          ) : (
            <VersionsTable projectId={params.projectId} versions={versions} />
          )}
        </Box>
      </>
    </ProjectsBreadcrumbs>
  );
}
