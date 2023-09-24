"use client";
import { beff } from "@/utils/beff";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Text, Button, Dialog, Flex, Box, Link, ScrollArea, TextField } from "@radix-ui/themes";
import { FC, useState } from "react";
import NextLink from "next/link";

import Fuse from "fuse.js";
const ProjectList: FC<{
  search: string;
}> = ({ search }) => {
  const query = beff["/repo"].get().useQuery();

  if (query.isLoading) {
    return (
      <Flex direction="column" p="2">
        <Text size="1" color="gray">
          Loading…
        </Text>
      </Flex>
    );
  }

  const fuse = new Fuse(query.data ?? [], {
    keys: ["fullName"],
  });

  const filtered = search == "" ? query.data ?? [] : fuse.search(search).map((it) => it.item);

  return (
    <Flex direction="column" p="2">
      {filtered.map((it) => (
        <Box key={it.nodeId}>
          <Link size="1" asChild>
            <NextLink href={`/project/new?fullName=${encodeURIComponent(it.fullName)}`}>
              {it.fullName}
            </NextLink>
          </Link>
        </Box>
      ))}
    </Flex>
  );
};

const DialogContent = () => {
  const [search, setSearch] = useState("");
  return (
    <>
      <Dialog.Title>New Project</Dialog.Title>
      <Dialog.Description size="2" mb="4">
        Create a new project based on a git repository.
      </Dialog.Description>
      <TextField.Root>
        <TextField.Slot>
          <MagnifyingGlassIcon height="16" width="16" />
        </TextField.Slot>
        <TextField.Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search the repos…"
        />
      </TextField.Root>

      <ScrollArea type="always" scrollbars="vertical" style={{ height: 180 }}>
        <ProjectList search={search} />
      </ScrollArea>
      <Box>
        <Text size="1">Cannot find repository?</Text> <Link size="1">Try installing the Beff Github App</Link>
      </Box>
      <Flex gap="3" mt="4" justify="end">
        <Dialog.Close>
          <Button variant="soft" color="gray">
            Cancel
          </Button>
        </Dialog.Close>
      </Flex>
    </>
  );
};

export const NewProjectButton = () => (
  <Dialog.Root>
    <Dialog.Trigger>
      <Button>New Project</Button>
    </Dialog.Trigger>
    <Dialog.Content>
      <DialogContent />
    </Dialog.Content>
  </Dialog.Root>
);
