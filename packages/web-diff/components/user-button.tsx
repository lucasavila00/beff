"use client";
import { FC, useEffect, useState } from "react";
import { Text, Avatar, DropdownMenu, IconButton } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { SettingsDialog } from "./settings-dialog";

const ThemeChanger = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <></>;
  }

  return (
    <>
      <DropdownMenu.RadioGroup
        value={theme}
        onValueChange={(newValue) => setTheme(newValue)}
      >
        <DropdownMenu.RadioItem value="system">System</DropdownMenu.RadioItem>
        <DropdownMenu.RadioItem value="dark">Dark</DropdownMenu.RadioItem>
        <DropdownMenu.RadioItem value="light">Light</DropdownMenu.RadioItem>
      </DropdownMenu.RadioGroup>
    </>
  );
};

export const UserButton: FC<{ image: string; name: string }> = async ({
  image,
  name,
}) => {
  const router = useRouter();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton radius="full">
          <Avatar size="2" src={image} fallback={name} />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Label>{name}</DropdownMenu.Label>
        <SettingsDialog>
          <DropdownMenu.Item
            onSelect={(ev) => {
              ev.preventDefault();
            }}
          >
            Settings
          </DropdownMenu.Item>
        </SettingsDialog>
        <DropdownMenu.Item onSelect={() => router.push("/api/auth/signout")}>
          Logout
        </DropdownMenu.Item>

        <DropdownMenu.Separator />
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Color</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <ThemeChanger />
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
