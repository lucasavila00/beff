import { StringFormat } from "@beff/cli";

export type ValidCurrency = StringFormat<"ValidCurrency">;

export enum OtherEnum2 {
  C = "c",
  D = "d",
}

const ARR3 = ["X", "Y"] as const;

export type Arr3 = (typeof ARR3)[number];
