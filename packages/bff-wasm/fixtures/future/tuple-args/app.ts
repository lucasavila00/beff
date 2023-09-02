type User = {
  name: string;
};

type Pagination = [limit: number, offset: number];
const runQuery = (q: Pagination): User[] => {
  return [];
};
type Ctx = any;

export default {
  [`/user`]: {
    get: async (c: Ctx, ...q: Pagination): Promise<User[]> => {
      return runQuery(q);
    },
  },
};
