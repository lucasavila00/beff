import { GET, POST } from "bff";

type Logger = {
  log: (message: string) => void;
};

type User = {
  name: string;
};

export type Dependencies = {
  logger: Logger;
};

export default {
  [GET`/{name}`]: async (
    name: string,
    logger: Dependencies["logger"]
  ): Promise<User> => {
    logger.log(`Getting user ${name}`);
    return { name };
  },
  [POST`/{name}`]: async (name: string, deps: Dependencies): Promise<User> => {
    deps.logger.log(`Posting user ${name}`);
    return { name };
  },
};
