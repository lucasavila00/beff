import parse from "./generated/parser";
import { NumberFormat, NumberFormatExtends, StringFormat, StringFormatExtends } from "@beff/client";

export type ValidCurrency = StringFormat<"ValidCurrency">;

export type UserId = StringFormat<"UserId">;
export type ReadAuthorizedUserId = StringFormatExtends<UserId, "ReadAuthorizedUserId">;
export type WriteAuthorizedUserId = StringFormatExtends<ReadAuthorizedUserId, "WriteAuthorizedUserId">;

export type NonInfiniteNumber = NumberFormat<"NonInfiniteNumber">;
export type NonNegativeNumber = NumberFormatExtends<NonInfiniteNumber, "NonNegativeNumber">;
export type Rate = NumberFormatExtends<NonNegativeNumber, "Rate">;

export const Codecs = parse.buildParsers<{
  ValidCurrency: ValidCurrency;
  UserId: UserId;
  ReadAuthorizedUserId: ReadAuthorizedUserId;
  WriteAuthorizedUserId: WriteAuthorizedUserId;
  NonInfiniteNumber: NonInfiniteNumber;
  NonNegativeNumber: NonNegativeNumber;
  Rate: Rate;
}>({
  stringFormats: {
    ValidCurrency: (input: string) => input === "USD",
    UserId: (input: string) => input.startsWith("user_"),
    ReadAuthorizedUserId: (input: string) => input.includes("_read_"),
    WriteAuthorizedUserId: (input: string) => input.includes("_write_"),
  },
  numberFormats: {
    NonInfiniteNumber: (input: number) => Number.isFinite(input),
    NonNegativeNumber: (input: number) => input >= 0,
    Rate: (input: number) => input >= 0 && input <= 1,
  },
});
