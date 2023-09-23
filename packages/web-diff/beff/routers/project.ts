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
  version: string;
  updatedAt: Date;
  schema: string;
};

export const ProjectRouter = {
  "/project/{id}/versions": {
    get: (_c: Ctx, id: string): Promise<ProjectVersion[]> =>
      prisma.projectVersion.findMany({ where: { projectId: id } }),
  },
  "/project/{id}": {
    get: (_c: Ctx, id: string): Promise<BeffProject | null> =>
      prisma.project.findUnique({ where: { id } }),
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
