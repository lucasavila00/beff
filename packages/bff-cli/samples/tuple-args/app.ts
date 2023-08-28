type User = {
  name: string;
};

type Pagination = [limit: number, offset: number];
const runQuery = (q: Pagination): User[] => {
  return [];
};

export default {
  [`GET/user`]: async (...q: Pagination): Promise<User[]> => {
    return runQuery(q);
  },
};
