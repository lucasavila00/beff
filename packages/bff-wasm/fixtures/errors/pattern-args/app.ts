import { GET, todo } from "bff";

type User = {
  name: string;
};

export default {
  [`/user`]: {
    get: async ([limit, offset]: string[]): Promise<User[]> => {
      return todo();
    },
  },
  [`/user1`]: {
    get: async ({ limit, offset }: any): Promise<User[]> => {
      return todo();
    },
  },
  [`/user2`]: {
    get: async (a: string[] = []): Promise<User[]> => {
      return todo();
    },
  },
};
