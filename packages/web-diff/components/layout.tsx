import { FC } from "react";
import { Flex, Text, Box, Link, Heading, Button } from "@radix-ui/themes";
import { UserButton } from "@/components/user-button";
import { Session } from "next-auth";
import NextLink from "next/link";
import { DiscIcon } from "@radix-ui/react-icons";
import { twMerge } from "tailwind-merge";
const ConnectedUserButton: FC<{ session: Session | null }> = async ({
  session,
}) => {
  if (session == null) {
    return <></>;
  }
  const name = session.user?.name ?? "";
  const image = session.user?.image ?? "";
  return <UserButton name={name} image={image} />;
};

const SideBarLink: FC<{
  href: string;
  active: boolean;
  text: string;
  icon: (props: { width: string; height: string }) => React.ReactNode;
}> = ({ href, active, text, icon }) => {
  const Icon = icon;
  return (
    <NextLink
      className={twMerge(
        "rounded-1 p-1.5",
        active ? "text-blue-10 bg-blue-3" : "text-gray-11 hover:bg-gray-3"
      )}
      href={href}
    >
      <Flex gap="1" align="center">
        <Icon width="18" height="18" />
        <Text size="2" weight="medium">
          {text}
        </Text>
      </Flex>
    </NextLink>
  );
};

export const Layout: FC<{
  children: React.ReactNode;
  session: Session | null;
}> = async ({ children, session }) => {
  return (
    <>
      <Flex width="100%" height="100%">
        <Flex
          direction="column"
          justify="between"
          className="bg-gray-1 dark:bg-gray-0 border-r border-gray-5 w-56"
        >
          <Flex direction="column" align="start">
            <Flex className="h-20" px="6" align="center" width="100%">
              <NextLink href="/">
                <Heading>Beff Diff</Heading>
              </NextLink>
            </Flex>
            <Flex px="6" direction="column" gap="1" width="100%">
              <SideBarLink
                href="/"
                active={true}
                text="Projects"
                icon={DiscIcon}
              />
            </Flex>
          </Flex>
          <Flex p="6" direction="column">
            <ConnectedUserButton session={session} />
          </Flex>
        </Flex>
        <Flex
          direction="column"
          grow="1"
          style={{
            minWidth: 600,
          }}
        >
          <Flex
            className="border-b dark:bg-gray-2 border-gray-5 h-20"
            align="center"
            pl="6"
          >
            <Text weight="bold">
              <Link asChild color="gray">
                <NextLink href="/">Home</NextLink>
              </Link>
            </Text>
          </Flex>
          <Box grow="1" className="dark:bg-gray-2">
            {children}
          </Box>
        </Flex>
      </Flex>
    </>
  );
};
