"use client";
import {
  Text,
  Button,
  Dialog,
  Flex,
  Box,
  Link,
  ScrollArea,
} from "@radix-ui/themes";

export const NewProjectButton = () => {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button>New Project</Button>
      </Dialog.Trigger>

      <Dialog.Content>
        <Dialog.Title>New Project</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Create a new project based on a git repository.
        </Dialog.Description>
        <ScrollArea
          type="always"
          scrollbars="vertical"
          style={{ height: 180 }}
        ></ScrollArea>
        <Box>
          <Text size="1">Cannot find repository?</Text>{" "}
          <Link size="1">Try installing the Beff Github App</Link>
        </Box>
        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
