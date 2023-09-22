import { Box, Text, Flex, Link } from "@radix-ui/themes";
import { FC, Fragment, ReactNode } from "react";
import NextLink from "next/link";
import { SlashIcon } from "@radix-ui/react-icons";

type Crumb = {
  href: string | null;
  text: string;
};

const RenderExtraCrumb: FC<{ href: string | null; text: string }> = ({
  href,
  text,
}) => {
  if (href == null) {
    return (
      <Text color="gray" weight="bold" ml="2">
        {text}
      </Text>
    );
  }
  return (
    <Text weight="bold" ml="2">
      <Link asChild color="gray">
        <NextLink href={href}>{text}</NextLink>
      </Link>
    </Text>
  );
};

export const BreadCrumbs: FC<{ children: ReactNode; crumbs: Crumb[] }> = ({
  children,
  crumbs,
}) => {
  return (
    <>
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
        {crumbs.map((crumb) => {
          return (
            <Fragment key={crumb.text}>
              <Box ml="2">
                <SlashIcon width={16} height={16} />
              </Box>
              <RenderExtraCrumb text={crumb.text} href={crumb.href} />
            </Fragment>
          );
        })}
      </Flex>
      <Box grow="1" className="dark:bg-gray-2">
        {children}
      </Box>
    </>
  );
};
