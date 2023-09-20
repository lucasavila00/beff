"use client";
import { Session } from "next-auth";
import { FC, useEffect, useState } from "react";
import { Text, Avatar, DropdownMenu, IconButton } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

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

export const UserButton: FC<{ session: Session }> = async ({ session }) => {
  const image = session.user?.image;
  const router = useRouter();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton radius="full">
          <Avatar
            size="2"
            src={image ?? ""}
            fallback={session.user?.name?.[0] ?? "U"}
          />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Label>
          <Text size="2">{session.user?.name}</Text>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Color</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <ThemeChanger />
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>

        <DropdownMenu.Item onSelect={() => router.push("/settings")}>
          Settings
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => router.push("/api/auth/signout")}>
          Logout
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
