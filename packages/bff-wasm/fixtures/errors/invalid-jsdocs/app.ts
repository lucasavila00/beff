/**
 * @title abc
 * @augments asd
 * @xxx yyy
 */
export default {
  /**
   * @title abc
   * @augments asd
   * @xxx zzzz
   */
  [`/hello/{id}`]: {
    get: async (
      c: Ctx,
      /**
       * @title abc
       * @augments asd
       * @xxx asasasasas
       */
      id: string
    ): Promise<string> => id,
  },
};
