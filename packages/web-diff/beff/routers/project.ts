import { prisma } from "@/utils/prisma";
import { Ctx } from "@beff/hono";

export type BeffProject = {
  id: string;
  fullName: string;
  updatedAt: Date;
};
export type ProjectVersion = {
  id: string;
  projectId: string;
  createdAt: Date;
  openApiSchema: unknown;
  branch: string;
  commitHash: string;
};

export const ProjectRouter = {
  "/project/{projectId}/version/{versionId}": {
    get: (_c: Ctx, projectId: string, versionId: string): Promise<ProjectVersion | null> =>
      prisma.projectVersion.findUnique({ where: { id: versionId, projectId: projectId } }),
  },
  "/project/{projectId}/version": {
    get: (_c: Ctx, projectId: string): Promise<ProjectVersion[]> =>
      prisma.projectVersion.findMany({
        where: { projectId: projectId },
        orderBy: {
          createdAt: "desc",
        },
      }),
  },
  "/project/{projectId}": {
    get: (_c: Ctx, projectId: string): Promise<BeffProject | null> =>
      prisma.project.findUnique({ where: { id: projectId } }),
  },
  "/project": {
    get: (_c: Ctx): Promise<BeffProject[]> => prisma.project.findMany(),
    put: (_c: Ctx, fullName: string): Promise<BeffProject> =>
      prisma.project.create({
        data: {
          fullName,
        },
      }),
  },
};
