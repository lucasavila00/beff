import { ProjectVersion } from "@/beff/routers/project";
import { getVersionLabel } from "@/utils/helpers";
import { ThickArrowLeftIcon, ThickArrowRightIcon } from "@radix-ui/react-icons";
import { Box, Flex, Heading, IconButton, Link, Text } from "@radix-ui/themes";
import { FC } from "react";
import NextLink from "next/link";
import { Links } from "@/utils/route-links";

const VersionName: FC<{
  desc: "from" | "to";
  version: ProjectVersion;
}> = ({ desc, version }) => {
  const versionLabel = getVersionLabel(version);

  return (
    <Flex grow="1" direction="column" align="center">
      <Heading size="1">{desc}</Heading>
      <Link asChild>
        <NextLink href={Links["/project/{projectId}/version/{versionId}"](version.projectId, version.id)}>
          {versionLabel}
        </NextLink>
      </Link>
    </Flex>
  );
};
export const ToggleComparison: FC<{ version: ProjectVersion; oldVersion: ProjectVersion }> = ({
  version,
  oldVersion,
}) => {
  return (
    <>
      <Flex mb="8" align="center" justify="between">
        <VersionName desc="from" version={oldVersion} />

        <Box>
          <NextLink
            href={Links["/project/{projectId}/version/{versionId}/compare/{oldVersionId}"](
              version.projectId,
              oldVersion.id,
              version.id
            )}
          >
            <IconButton color="gray" variant="ghost">
              <ThickArrowRightIcon />
              <ThickArrowLeftIcon />
            </IconButton>
          </NextLink>
        </Box>
        <VersionName desc="to" version={version} />
      </Flex>
    </>
  );
};
