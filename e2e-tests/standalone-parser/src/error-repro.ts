export type Query = {
  orderBy:
    | undefined
    | {
        direction: "asc" | "desc";
        field: "name" | "age";
      };
};
