import { beffLocalClient } from "@/app/api/beff/[...beff]/router-app";
import { NotFound } from "@/components/not-found";
import { ProjectsBreadcrumbs } from "@/components/projects-breadcrumbs";
import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { format } from "timeago.js";

export default async function Page({ params }: { params: { id: string; version: string } }) {
  const version = await beffLocalClient["/project/{id}/version/{version}"].get(params.id, params.version);
  if (version == null) {
    return <NotFound />;
  }
  return (
    <>
      <ProjectsBreadcrumbs
        projectId={params.id}
        extra={[
          {
            href: `/project/${params.id}/version`,
            text: "Versions",
          },
          {
            href: `/project/${params.id}/version/${params.version}`,
            text: version?.version ?? "...",
          },
        ]}
      >
        <Box className="mx-auto max-w-2xl" pt="8">
          <Flex justify="between" align="baseline">
            <Heading color="gray" mb="6">
              Versions
            </Heading>

            <Text color="gray">{format(version?.updatedAt)}</Text>
          </Flex>
          <pre>{JSON.stringify(version, null, 2)}</pre>
        </Box>
      </ProjectsBreadcrumbs>
    </>
  );
}
