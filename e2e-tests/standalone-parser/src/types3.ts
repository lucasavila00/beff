import { StringFormat, NumberFormat, NumberFormatExtends, StringFormatExtends } from "@beff/client";

export type ValidCurrency = StringFormat<"ValidCurrency">;

export enum OtherEnum2 {
  C = "c",
  D = "d",
}

const ARR3 = ["X", "Y"] as const;

export type Arr3 = (typeof ARR3)[number];

export type NonInfiniteNumber = NumberFormat<"NonInfiniteNumber">;
export type NonNegativeNumber = NumberFormatExtends<NonInfiniteNumber, "NonNegativeNumber">;
export type Rate = NumberFormatExtends<NonNegativeNumber, "Rate">;

export type UserId = StringFormat<"UserId">;
export type ReadAuthorizedUserId = StringFormatExtends<UserId, "ReadAuthorizedUserId">;
export type WriteAuthorizedUserId = StringFormatExtends<ReadAuthorizedUserId, "WriteAuthorizedUserId">;
