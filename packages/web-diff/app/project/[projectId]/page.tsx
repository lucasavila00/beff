import { ProjectsBreadcrumbs } from "@/components/projects-breadcrumbs";

export default async function Repo({ params }: { params: { projectId: string } }) {
  return (
    <ProjectsBreadcrumbs projectId={params.projectId} extra={[]}>
      <>
        <pre>{JSON.stringify(params, null, 2)}</pre>
      </>
    </ProjectsBreadcrumbs>
  );
}
