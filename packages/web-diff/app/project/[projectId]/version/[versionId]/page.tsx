import { beffLocalClient } from "@/app/api/beff/[...beff]/router-app";
import { NotFound } from "@/components/not-found";
import { ProjectsBreadcrumbs } from "@/components/projects-breadcrumbs";
import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { format } from "timeago.js";

export default async function Page({ params }: { params: { projectId: string; versionId: string } }) {
  const version = await beffLocalClient["/project/{projectId}/version/{versionId}"].get(
    params.projectId,
    params.versionId
  );
  if (version == null) {
    return <NotFound />;
  }
  return (
    <>
      <ProjectsBreadcrumbs
        projectId={params.projectId}
        extra={[
          {
            href: `/project/${params.projectId}/version`,
            text: "Versions",
          },
          {
            href: `/project/${params.projectId}/version/${params.versionId}`,
            text: version.version,
          },
        ]}
      >
        <Box className="mx-auto max-w-2xl" pt="8">
          <Flex justify="between" align="baseline">
            <Heading color="gray" mb="6">
              {version.version}
            </Heading>

            <Text color="gray">{format(version?.updatedAt)}</Text>
          </Flex>
          <pre>{JSON.stringify(version, null, 2)}</pre>
        </Box>
      </ProjectsBreadcrumbs>
    </>
  );
}
