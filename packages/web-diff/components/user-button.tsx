"use client";
import { Avatar, Button, DropdownMenu, Text } from "@radix-ui/themes";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
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
      <DropdownMenu.RadioGroup value={theme} onValueChange={(newValue) => setTheme(newValue)}>
        <DropdownMenu.RadioItem value="system">System</DropdownMenu.RadioItem>
        <DropdownMenu.RadioItem value="dark">Dark</DropdownMenu.RadioItem>
        <DropdownMenu.RadioItem value="light">Light</DropdownMenu.RadioItem>
      </DropdownMenu.RadioGroup>
    </>
  );
};

export const UserButton: FC<{ image: string; name: string }> = async ({ image, name }) => {
  const router = useRouter();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="surface" size="3">
          <Avatar ml="-2" mr="-1" size="2" src={image} fallback={name} />
          <Text size="1" className="truncate">
            {name}
          </Text>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Theme</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <ThemeChanger />
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>

        <SettingsDialog>
          <DropdownMenu.Item
            onSelect={(ev) => {
              ev.preventDefault();
            }}
          >
            Settings
          </DropdownMenu.Item>
        </SettingsDialog>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onSelect={() => router.push("/api/auth/signout")}>Logout</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
