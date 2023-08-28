import { GET } from "bff";

type User = {
  name: string;
};

type Pagination = [number, number];
const runQuery = (q: Pagination): User[] => {
  return [];
};

export default {
  [`GET/user`]: async (...q: Pagination): Promise<User[]> => {
    return runQuery(q);
  },
};
