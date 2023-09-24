import { ProjectVersion } from "@/beff/routers/project";
import { getVersionLabel } from "@/utils/helpers";
import { ThickArrowLeftIcon, ThickArrowRightIcon } from "@radix-ui/react-icons";
import { Box, Flex, Heading, IconButton, Text } from "@radix-ui/themes";
import { FC } from "react";
import NextLink from "next/link";
import { Links } from "@/utils/route-links";

export const ToggleComparison: FC<{ version: ProjectVersion; oldVersion: ProjectVersion }> = ({
  version,
  oldVersion,
}) => {
  const versionLabel = getVersionLabel(version);
  const oldVersionLabel = getVersionLabel(oldVersion);
  return (
    <>
      <Flex mb="8" align="center" justify="between">
        <Flex grow="1" direction="column" align="center">
          <Heading size="1">from</Heading>
          <Text>{oldVersionLabel}</Text>
        </Flex>
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
        <Flex grow="1" direction="column" align="center">
          <Heading size="1">to</Heading>
          <Text>{versionLabel}</Text>
        </Flex>
      </Flex>
    </>
  );
};
