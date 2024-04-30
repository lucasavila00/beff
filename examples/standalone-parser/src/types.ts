export enum OtherEnum {
  A = "a",
  B = "b",
}

export const ARR1 = ["A", "B"] as const;

export const ARR2 = [...ARR1, "C"] as const;

export type Arr2 = (typeof ARR2)[number];
