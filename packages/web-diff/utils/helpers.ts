import { ProjectVersion } from "@/beff/routers/project";

export const getVersionLabel = (it: ProjectVersion) => {
  try {
    const v = (it.openApiSchema as any)?.info?.version;
    return `${v} (${it.commitHash})`;
  } catch (e) {}
  return it.commitHash;
};
