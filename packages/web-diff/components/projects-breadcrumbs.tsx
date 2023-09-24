import { FC, ReactNode } from "react";
import { beffLocalClient } from "@/app/api/beff/[...beff]/router-app";
import { BreadCrumbs, Crumb } from "@/components/breadcrumbs";
const splitFullName = (fullName: string | null | undefined) => {
  if (!fullName) return { owner: "Not found", name: "Not found" };
  const [owner, name] = fullName.split("/");
  return { owner, name };
};
export const ProjectsBreadcrumbs: FC<{
  children: ReactNode;
  projectId: string;
  extra: Crumb[];
}> = async ({ extra, children, projectId }) => {
  const project = await beffLocalClient["/project/{projectId}"].get(projectId);
  return (
    <BreadCrumbs
      crumbs={[
        {
          href: `/project/${projectId}`,
          text: splitFullName(project?.fullName).name,
        },
        ...extra,
      ]}
    >
      {children}
    </BreadCrumbs>
  );
};
