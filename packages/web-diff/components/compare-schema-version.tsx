"use client";
import { ProjectVersion } from "@/beff/routers/project";
import { Select } from "@radix-ui/themes";
import { FC } from "react";

export const CompareSchemaVersion: FC<{ versions: ProjectVersion[] }> = ({ versions }) => {
  if (versions.length === 0) {
    return <></>;
  }
  return (
    <Select.Root>
      <Select.Trigger placeholder="Select a version…" />
      <Select.Content>
        {versions.map((it) => {
          return (
            <Select.Item key={it.id} value={it.id}>
              {it.version}
            </Select.Item>
          );
        })}
      </Select.Content>
    </Select.Root>
  );
};
