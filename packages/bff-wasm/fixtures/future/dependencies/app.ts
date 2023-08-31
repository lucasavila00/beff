type Logger = {
  log: (message: string) => void;
};

type User = {
  name: string;
};
type Context = any;
export type Dependencies = {
  logger: Logger;
};

export default {
  [`GET/{name}`]:
    (logger: Dependencies["logger"]) =>
    async (name: string): Promise<User> => {
      logger.log(`Getting user ${name}`);
      return { name };
    },
  [`POST/{name}`]:
    (ctx: Context, deps: Dependencies) =>
    async (name: string): Promise<User> => {
      deps.logger.log(`Posting user ${name}`);
      return { name };
    },
};
