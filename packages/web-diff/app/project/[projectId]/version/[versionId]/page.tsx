import { beffLocalClient } from "@/beff/router-app";
import { NotFound } from "@/components/not-found";
import { ProjectsBreadcrumbs } from "@/components/projects-breadcrumbs";
import { Box, Card, Flex, Heading, Link, Text } from "@radix-ui/themes";
import { format } from "timeago.js";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import "highlight.js/styles/atom-one-dark.css";
import { init, schema_to_ts_types } from "@/pkg";
import NextLink from "next/link";
import { ExternalLinkIcon } from "@radix-ui/react-icons";

hljs.registerLanguage("typescript", typescript);

let cache: any = null;
const wasmGetter = (): { schema_to_ts_types: typeof schema_to_ts_types } => {
  if (cache) {
    return cache;
  }
  init(true);
  cache = { schema_to_ts_types };
  return cache;
};

export default async function Page({ params }: { params: { projectId: string; versionId: string } }) {
  const version = await beffLocalClient["/project/{projectId}/version/{versionId}"].get(
    params.projectId,
    params.versionId
  );
  if (version == null) {
    return <NotFound />;
  }
  const tsType = wasmGetter().schema_to_ts_types(version.schema);
  const tsTypeFmt = hljs.highlight(tsType, {
    language: "typescript",
  }).value;
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

          <Box>
            <Link href={`/project/${params.projectId}/version/${params.versionId}/json`} target="_blank">
              <Flex align="center" gap="1">
                <ExternalLinkIcon />
                Schema OpenAPI.json
              </Flex>
            </Link>
          </Box>
          <Box>
            <Link href={`/project/${params.projectId}/version/${params.versionId}/swagger`} target="_blank">
              <Flex align="center" gap="1">
                <ExternalLinkIcon />
                SwaggerUI
              </Flex>
            </Link>
          </Box>
          <Box>
            <Link href={`/project/${params.projectId}/version/${params.versionId}/redoc`} target="_blank">
              <Flex align="center" gap="1">
                <ExternalLinkIcon />
                Redoc
              </Flex>
            </Link>
          </Box>

          <pre className="mt-2">
            <code
              className="hljs p-2 rounded-1 overflow-auto"
              dangerouslySetInnerHTML={{
                __html: tsTypeFmt,
              }}
            />
          </pre>
        </Box>
      </ProjectsBreadcrumbs>
    </>
  );
}
