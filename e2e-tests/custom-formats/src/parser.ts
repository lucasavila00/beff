import parse from "./generated/parser";
import { NumberFormat, NumberFormatExtends, StringFormat, StringFormatExtends } from "@beff/client";

export type ValidCurrency = StringFormat<"ValidCurrency">;
export type ShortCode = StringFormat<"ShortCode">;

export type UserId = StringFormat<"UserId">;
export type ReadAuthorizedUserId = StringFormatExtends<UserId, "ReadAuthorizedUserId">;
export type WriteAuthorizedUserId = StringFormatExtends<ReadAuthorizedUserId, "WriteAuthorizedUserId">;

export type NonInfiniteNumber = NumberFormat<"NonInfiniteNumber">;
export type NegativeNumber = NumberFormat<"NegativeNumber">;
export type NonNegativeNumber = NumberFormatExtends<NonInfiniteNumber, "NonNegativeNumber">;
export type Rate = NumberFormatExtends<NonNegativeNumber, "Rate">;

export const Codecs = parse.buildParsers<{
  ValidCurrency: ValidCurrency;
  ShortCode: ShortCode;
  UserId: UserId;
  ReadAuthorizedUserId: ReadAuthorizedUserId;
  WriteAuthorizedUserId: WriteAuthorizedUserId;
  NonInfiniteNumber: NonInfiniteNumber;
  NegativeNumber: NegativeNumber;
  NonNegativeNumber: NonNegativeNumber;
  Rate: Rate;
}>({
  stringFormats: {
    ValidCurrency: {
      validator: (input: string) => input === "USD",
      errorMessage: () => "expected a valid ISO currency code",
    },
    ShortCode: {
      validator: (input: string) => input.length <= 3,
    },
    UserId: (input: string) => input.startsWith("user_"),
    ReadAuthorizedUserId: {
      validator: (input: string) => input.includes("_read_"),
      errorMessage: () => "expected user with read permissions",
    },
    WriteAuthorizedUserId: {
      validator: (input: string) => input.includes("_write_"),
      errorMessage: () => "expected user with write permissions",
    },
  },
  numberFormats: {
    NonInfiniteNumber: {
      validator: (input: number) => Number.isFinite(input),
      errorMessage: () => "expected a finite number",
    },
    NegativeNumber: {
      validator: (input: number) => input < 0,
    },
    NonNegativeNumber: {
      validator: (input: number) => input >= 0,
      errorMessage: () => "expected a non-negative number",
    },
    Rate: {
      validator: (input: number) => input >= 0 && input <= 1,
      errorMessage: () => "expected a valid rate",
    },
  },
});
