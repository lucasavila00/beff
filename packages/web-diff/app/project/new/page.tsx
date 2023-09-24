import { beffLocalClient } from "@/app/api/beff/[...beff]/router-app";
import { BreadCrumbs } from "@/components/breadcrumbs";
import { CreateProjectButton } from "@/components/create-project-button";
import { CheckCircledIcon, CrossCircledIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { Box, Text, Card, Flex, Heading, Button, Link } from "@radix-ui/themes";
import { FC } from "react";

const AppInstalledMessage: FC<{
  isAppInstalled: boolean;
}> = ({ isAppInstalled }) => {
  if (isAppInstalled) {
    return (
      <Flex mb="4" gap="1" align="center">
        <CheckCircledIcon color="green" />
        <Text size="1">The Github App is installed</Text>
      </Flex>
    );
  }

  return (
    <>
      <Flex gap="1" align="center">
        <CrossCircledIcon />
        <Text size="1">The Github App not installed</Text>
      </Flex>

      <Link mb="4" color="indigo" href="/todo">
        Install the Github App
      </Link>
    </>
  );
};

const NewProject: FC<{
  searchParams: { fullName: string };
}> = async ({ searchParams }) => {
  const installationStatus = await beffLocalClient["/installation/status"].get(searchParams.fullName);
  const isAppInstalled = installationStatus === "installed";

  return (
    <BreadCrumbs
      crumbs={[
        {
          href: null,
          text: "New Project",
        },
      ]}
    >
      <Box className="mx-auto max-w-xl" pt="8">
        <Card className="!bg-gray-1 dark:!bg-gray-3">
          <Flex p="4" align="center" direction="column">
            <Flex mb="4" gap="2" align="center">
              <GitHubLogoIcon width={16} height={16} />
              <Text>{searchParams.fullName}</Text>
            </Flex>
            <AppInstalledMessage isAppInstalled={isAppInstalled} />
            <CreateProjectButton fullName={searchParams.fullName} isAppInstalled={isAppInstalled} />
          </Flex>
        </Card>
      </Box>
    </BreadCrumbs>
  );
};
export default NewProject;
