import { StringFormat, NumberFormat } from "@beff/client";

export type ValidCurrency = StringFormat<"ValidCurrency">;
export type NonNegativeNumber = NumberFormat<"NonNegativeNumber">;

export enum OtherEnum2 {
  C = "c",
  D = "d",
}

const ARR3 = ["X", "Y"] as const;

export type Arr3 = (typeof ARR3)[number];
