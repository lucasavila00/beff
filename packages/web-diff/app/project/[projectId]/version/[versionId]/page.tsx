import { beffLocalClient } from "@/beff/router-app";
import { NotFound } from "@/components/not-found";
import { ProjectsBreadcrumbs } from "@/components/projects-breadcrumbs";
import { Box, Flex, Heading, Link, Text } from "@radix-ui/themes";
import { format } from "timeago.js";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import "highlight.js/styles/atom-one-dark.css";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { getVersionLabel } from "@/utils/helpers";
import { Links } from "@/utils/route-links";
import { beffWasm } from "@/utils/wasm";

hljs.registerLanguage("typescript", typescript);

export default async function Page({ params }: { params: { projectId: string; versionId: string } }) {
  const version = await beffLocalClient["/project/{projectId}/version/{versionId}"].get(
    params.projectId,
    params.versionId
  );
  if (version == null) {
    return <NotFound />;
  }
  const tsType = beffWasm().schema_to_ts_types(JSON.stringify(version.openApiSchema));
  const tsTypeFmt = hljs.highlight(tsType, {
    language: "typescript",
  }).value;
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
        ]}
      >
        <Box className="mx-auto max-w-2xl" pt="8">
          <Flex justify="between" align="baseline">
            <Heading color="gray" mb="6">
              {label}
            </Heading>

            <Text color="gray">{format(version.createdAt)}</Text>
          </Flex>

          <Box>
            <Link
              href={Links["/project/{projectId}/version/{versionId}/json"](
                params.projectId,
                params.versionId
              )}
              target="_blank"
            >
              <Flex align="center" gap="1">
                <ExternalLinkIcon />
                Schema OpenAPI.json
              </Flex>
            </Link>
          </Box>
          <Box>
            <Link
              href={Links["/project/{projectId}/version/{versionId}/swagger"](
                params.projectId,
                params.versionId
              )}
              target="_blank"
            >
              <Flex align="center" gap="1">
                <ExternalLinkIcon />
                SwaggerUI
              </Flex>
            </Link>
          </Box>
          <Box>
            <Link
              href={Links["/project/{projectId}/version/{versionId}/redoc"](
                params.projectId,
                params.versionId
              )}
              target="_blank"
            >
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
