import { beffLocalClient } from "@/beff/router-app";
import { NotFound } from "@/components/not-found";
import { ProjectsBreadcrumbs } from "@/components/projects-breadcrumbs";
import { getVersionLabel } from "@/utils/helpers";
import { Links } from "@/utils/route-links";
import { Box, Flex, Heading, Text } from "@radix-ui/themes";

export default async function Page({
  params,
}: {
  params: { projectId: string; versionId: string; oldVersionId: string };
}) {
  const version = await beffLocalClient["/project/{projectId}/version/{versionId}"].get(
    params.projectId,
    params.versionId
  );

  const oldVersion = await beffLocalClient["/project/{projectId}/version/{versionId}"].get(
    params.projectId,
    params.oldVersionId
  );
  if (version == null || oldVersion == null) {
    return <NotFound />;
  }
  const label = getVersionLabel(version);

  return (
    <>
      <ProjectsBreadcrumbs
        projectId={params.projectId}
        extra={[
          {
            href: Links["/project/{projectId}/version"](params.projectId),
            text: "Versions",
          },
          {
            href: Links["/project/{projectId}/version/{versionId}"](params.projectId, params.versionId),
            text: label,
          },
          {
            href: null,
            text: "Compare",
          },
        ]}
      >
        <Box className="mx-auto max-w-2xl" pt="8">
          <Flex justify="between" align="baseline">
            <Heading color="gray" mb="6">
              Compare
            </Heading>
          </Flex>
        </Box>
      </ProjectsBreadcrumbs>
    </>
  );
}
