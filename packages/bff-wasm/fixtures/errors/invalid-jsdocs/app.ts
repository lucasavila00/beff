/**
 * @title abc
 * @augments asd
 * @xxx yyy
 */
export default {
  /**
   * @title abc
   * @augments asd
   * @xxx yyy
   */
  [`/hello/{id}`]: {
    get: async (
      /**
       * @title abc
       * @augments asd
       * @xxx yyy
       */
      id: string
    ): Promise<string> => id,
  },
};
