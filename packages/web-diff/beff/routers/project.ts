import { prisma } from "@/utils/prisma";
import { Ctx } from "@beff/hono";

export type BeffProject = {
  id: string;
  fullName: string;
  updatedAt: Date;
};
export const ProjectRouter = {
  "/project": {
    get: async (_c: Ctx): Promise<BeffProject[]> => prisma.project.findMany(),
    put: async (_c: Ctx, fullName: string): Promise<BeffProject> =>
      prisma.project.create({
        data: {
          fullName,
        },
      }),
  },
};
