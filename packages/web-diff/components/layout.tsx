import { FC } from "react";
import { Flex, Text, Box, Link, Heading, Button } from "@radix-ui/themes";
import { UserButton } from "@/components/user-button";
import { Session, getServerSession } from "next-auth";
import NextLink from "next/link";
import { DiscIcon } from "@radix-ui/react-icons";
import { twMerge } from "tailwind-merge";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { IconProps } from "@radix-ui/react-icons/dist/types";
import { SideNavLinks } from "./side-nav-links";
import { Links } from "@/utils/route-links";

const ConnectedUserButton: FC<{ session: Session | null }> = async ({ session }) => {
  if (session == null) {
    return <></>;
  }
  const name = session.user?.name ?? "";
  const image = session.user?.image ?? "";
  return <UserButton name={name} image={image} />;
};

export const Layout: FC<{
  children: React.ReactNode;
}> = async ({ children }) => {
  const session = await getServerSession(authOptions);

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
              <NextLink href={Links["/"]()}>
                <Heading>Beff Diff</Heading>
              </NextLink>
            </Flex>
            <Flex px="6" direction="column" gap="1" width="100%">
              <SideNavLinks />
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
          {children}
        </Flex>
      </Flex>
    </>
  );
};
