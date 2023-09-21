import { BreadCrumbs } from "@/components/breadcrumbs";
import { FC } from "react";

const NewProject: FC = async () => {
  return (
    <BreadCrumbs
      crumbs={[
        {
          href: null,
          text: "New Project",
        },
      ]}
    >
      <>new project</>
    </BreadCrumbs>
  );
};
export default NewProject;
