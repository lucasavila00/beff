"use client";
import { DiscIcon } from "@radix-ui/react-icons";
import { IconProps } from "@radix-ui/react-icons/dist/types";
import { Flex, Text } from "@radix-ui/themes";
import NextLink from "next/link";
import { FC } from "react";
import { twMerge } from "tailwind-merge";
import { useParams, usePathname } from "next/navigation";
import { LinkPatterns } from "@/utils/route-links";

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
type NavigationLinkInput = {
  linkPattern: LinkPatterns;
  text: string;
  active: boolean;
  icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;
};

const HOME: NavigationLinkInput[] = [
  {
    linkPattern: "/",
    text: "Projects",
    active: false,
    icon: DiscIcon,
  },
];

const PROJECTS: NavigationLinkInput[] = [
  {
    linkPattern: "/project/{projectId}",
    text: "Dashboard",
    active: false,
    icon: DiscIcon,
  },
  {
    linkPattern: "/project/{projectId}/version",
    text: "Versions",
    active: false,
    icon: DiscIcon,
  },
  {
    linkPattern: "/project/{projectId}/branches",
    text: "Branches",
    active: false,
    icon: DiscIcon,
  },
];

type NavigationLink = NavigationLinkInput & { href: string };

const getNav = (pathname: string): NavigationLinkInput[] => {
  if (pathname === "/") {
    return HOME;
  }
  if (pathname.startsWith("/project")) {
    return PROJECTS;
  }
  throw new Error(`Unknown path ${pathname}`);
};
const useNav = (): NavigationLink[] => {
  const pathname = usePathname();
  const params = useParams();

  const nav = getNav(pathname);
  return nav.map((it) => {
    const href = Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(`{${key}}`, String(value)),
      it.linkPattern as string
    );
    return {
      ...it,
      active: pathname === href,
      href,
    };
  });
};
export const SideNavLinks: FC = () => {
  const nav = useNav();
  return (
    <>
      {nav.map((link) => (
        <SideBarLink
          key={link.href}
          href={link.href}
          active={link.active}
          text={link.text}
          icon={link.icon}
        />
      ))}
    </>
  );
};
