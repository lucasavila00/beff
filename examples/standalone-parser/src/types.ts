import { StringFormat } from "@beff/cli";

export enum OtherEnum {
  A = "a",
  B = "b",
}

export const ARR1 = ["A", "B"] as const;
export type ARR1 = (typeof ARR1)[number];

export const ARR2 = [...ARR1, "C"] as const;

export type Arr2 = (typeof ARR2)[number];

export type ValidCurrency = StringFormat<"ValidCurrency">;
