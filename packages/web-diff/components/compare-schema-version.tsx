"use client";
import { ProjectVersion } from "@/beff/routers/project";
import { getVersionLabel } from "@/utils/helpers";
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
          const label = getVersionLabel(it);
          return (
            <Select.Item key={it.id} value={it.id}>
              {label}
            </Select.Item>
          );
        })}
      </Select.Content>
    </Select.Root>
  );
};
