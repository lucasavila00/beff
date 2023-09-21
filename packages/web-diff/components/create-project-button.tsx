"use client";

import { beff } from "@/utils/beff";
import { Button } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { FC } from "react";

export const CreateProjectButton: FC<{
  isAppInstalled: boolean;
  fullName: string;
}> = ({ isAppInstalled, fullName }) => {
  const router = useRouter();

  const newProjectMutation = beff["/project/new"].post(fullName).useMutation({
    onSuccess: (res) => {
      router.push(`/project/${res.id}`);
    },
  });

  return (
    <Button
      onClick={() => newProjectMutation.mutate({})}
      disabled={!isAppInstalled || newProjectMutation.isLoading}
    >
      Create Project
    </Button>
  );
};
