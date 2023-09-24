"use client";
import { CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";
import { Callout } from "@radix-ui/themes";
import { FC } from "react";

export const ErrorCountCallout: FC<{ count: number }> = ({ count }) => {
  if (count == 0) {
    return (
      <Callout.Root color="green" mb="4">
        <Callout.Icon>
          <CheckCircledIcon />
        </Callout.Icon>
        <Callout.Text>Backwards compatible</Callout.Text>
      </Callout.Root>
    );
  }
  return (
    <Callout.Root color="red" mb="4">
      <Callout.Icon>
        <CrossCircledIcon />
      </Callout.Icon>
      <Callout.Text>Not backwards compatible</Callout.Text>
    </Callout.Root>
  );
};
