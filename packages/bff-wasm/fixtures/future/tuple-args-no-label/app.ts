type User = {
  name: string;
};

type Pagination = [number, number];
const runQuery = (q: Pagination): User[] => {
  return [];
};

export default {
  [`/user`]: {
    get: async (...q: Pagination): Promise<User[]> => {
      return runQuery(q);
    },
  },
};
