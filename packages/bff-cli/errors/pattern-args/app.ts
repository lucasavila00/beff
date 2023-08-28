import { GET, todo } from "bff";

type User = {
  name: string;
};

export default {
  [`GET/user`]: async ([limit, offset]: string[]): Promise<User[]> => {
    return todo();
  },
  [`GET/user1`]: async ({ limit, offset }: any): Promise<User[]> => {
    return todo();
  },
  [`GET/user2`]: async (a: string[] = []): Promise<User[]> => {
    return todo();
  },
};
