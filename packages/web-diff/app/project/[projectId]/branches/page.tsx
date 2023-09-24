import { ProjectsBreadcrumbs } from "@/components/projects-breadcrumbs";

export default async function Branches({ params }: { params: { projectId: string } }) {
  return (
    <ProjectsBreadcrumbs
      projectId={params.projectId}
      extra={[
        {
          href: `/project/${params.projectId}/branches`,
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
