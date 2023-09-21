"use client";
import { DropdownMenu } from "@radix-ui/themes";
import { FC, ReactNode } from "react";

export type GithubRepoData = {
  name: string;
  id: number;
  node_id: string;
  full_name: string;
  owner_login: string;
  private: boolean;
};
export const ReposDropdown: FC<{
  repositories: GithubRepoData[];
  children: ReactNode;
}> = ({ children, repositories }) => {
  const firstFive = repositories.slice(0, 5);
  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>{children}</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          {firstFive.map((repo) => (
            <DropdownMenu.Item key={repo.id}>{repo.name}</DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator />
          <DropdownMenu.Item>More</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </>
  );
};
