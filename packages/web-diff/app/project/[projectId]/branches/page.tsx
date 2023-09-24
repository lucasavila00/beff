import { ProjectsBreadcrumbs } from "@/components/projects-breadcrumbs";
import { Links } from "@/utils/route-links";

export default async function Branches({ params }: { params: { projectId: string } }) {
  return (
    <ProjectsBreadcrumbs
      projectId={params.projectId}
      extra={[
        {
          href: Links["/project/{projectId}/branches"](params.projectId),
          text: "Branches",
        },
      ]}
    >
      <>
        <pre>{JSON.stringify(params, null, 2)}</pre>
      </>
    </ProjectsBreadcrumbs>
  );
}
