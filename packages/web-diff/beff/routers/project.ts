import { prisma } from "@/utils/prisma";
import { Ctx } from "@beff/hono";

type NewProjectResponse = {
  id: string;
  fullName: string;
};
export const ProjectRouter = {
  "/project/new": {
    post: async (_c: Ctx, fullName: string): Promise<NewProjectResponse> =>
      prisma.project.create({
        data: {
          fullName,
        },
      }),
  },
};
