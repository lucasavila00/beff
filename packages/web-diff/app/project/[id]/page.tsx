import { ProjectsBreadcrumbs } from "@/components/projects-breadcrumbs";

export default async function Repo({ params }: { params: { id: string } }) {
  return (
    <ProjectsBreadcrumbs projectId={params.id} extra={[]}>
      <>
        <pre>{JSON.stringify(params, null, 2)}</pre>
      </>
    </ProjectsBreadcrumbs>
  );
}
