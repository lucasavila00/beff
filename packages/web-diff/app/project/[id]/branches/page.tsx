import { ProjectsBreadcrumbs } from "@/components/projects-breadcrumbs";

export default async function Branches({ params }: { params: { id: string } }) {
  return (
    <ProjectsBreadcrumbs
      projectId={params.id}
      extra={[
        {
          href: `/project/${params.id}/branches`,
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
