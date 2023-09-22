import { Ctx } from "@beff/hono";

type NewProjectResponse = {
  id: string;
};
export const ProjectRouter = {
  "/project/new": {
    post: async (_c: Ctx, fullName: string): Promise<NewProjectResponse> => {
      return {
        id: "TODO",
      };
    },
  },
};
