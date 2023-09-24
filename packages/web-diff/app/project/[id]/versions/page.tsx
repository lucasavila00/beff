import { beffLocalClient } from "@/app/api/beff/[...beff]/router-app";
import { ProjectsBreadcrumbs } from "@/components/projects-breadcrumbs";

export default async function Branches({ params }: { params: { id: string } }) {
  const versions = await beffLocalClient["/project/{id}/versions"].get(
    params.id
  );
  return (
    <ProjectsBreadcrumbs
      projectId={params.id}
      extra={[
        {
          href: `/project/${params.id}/versions`,
          text: "Versions",
        },
      ]}
    >
      <>
        <pre>{JSON.stringify(versions, null, 2)}</pre>
      </>
    </ProjectsBreadcrumbs>
  );
}
