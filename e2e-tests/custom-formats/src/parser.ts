import parse from "./generated/parser";
import { NumberFormat, NumberFormatExtends, StringFormat, StringFormatExtends } from "@beff/client";

export type ValidCurrency = StringFormat<"ValidCurrency">;
export type ShortCode = StringFormat<"ShortCode">;

export type UserId = StringFormat<"UserId">;
export type ReadAuthorizedUserId = StringFormatExtends<UserId, "ReadAuthorizedUserId">;
export type WriteAuthorizedUserId = StringFormatExtends<ReadAuthorizedUserId, "WriteAuthorizedUserId">;
export type StringParentNoMsg = StringFormat<"StringParentNoMsg">;
export type StringChildNoMsg = StringFormatExtends<StringParentNoMsg, "StringChildNoMsg">;
export type StringParentMsgOnly = StringFormat<"StringParentMsgOnly">;
export type StringParentMsgOnlyChild = StringFormatExtends<StringParentMsgOnly, "StringParentMsgOnlyChild">;
export type StringChildMsgParent = StringFormat<"StringChildMsgParent">;
export type StringChildMsg = StringFormatExtends<StringChildMsgParent, "StringChildMsg">;
export type StringBothMsgParent = StringFormat<"StringBothMsgParent">;
export type StringBothMsgChild = StringFormatExtends<StringBothMsgParent, "StringBothMsgChild">;

export type NonInfiniteNumber = NumberFormat<"NonInfiniteNumber">;
export type NegativeNumber = NumberFormat<"NegativeNumber">;
export type NonNegativeNumber = NumberFormatExtends<NonInfiniteNumber, "NonNegativeNumber">;
export type Rate = NumberFormatExtends<NonNegativeNumber, "Rate">;
export type NumberParentNoMsg = NumberFormat<"NumberParentNoMsg">;
export type NumberChildNoMsg = NumberFormatExtends<NumberParentNoMsg, "NumberChildNoMsg">;
export type NumberParentMsgOnly = NumberFormat<"NumberParentMsgOnly">;
export type NumberParentMsgOnlyChild = NumberFormatExtends<NumberParentMsgOnly, "NumberParentMsgOnlyChild">;
export type NumberChildMsgParent = NumberFormat<"NumberChildMsgParent">;
export type NumberChildMsg = NumberFormatExtends<NumberChildMsgParent, "NumberChildMsg">;
export type NumberBothMsgParent = NumberFormat<"NumberBothMsgParent">;
export type NumberBothMsgChild = NumberFormatExtends<NumberBothMsgParent, "NumberBothMsgChild">;

export const Codecs = parse.buildParsers<{
  ValidCurrency: ValidCurrency;
  ShortCode: ShortCode;
  UserId: UserId;
  ReadAuthorizedUserId: ReadAuthorizedUserId;
  WriteAuthorizedUserId: WriteAuthorizedUserId;
  StringParentNoMsg: StringParentNoMsg;
  StringChildNoMsg: StringChildNoMsg;
  StringParentMsgOnly: StringParentMsgOnly;
  StringParentMsgOnlyChild: StringParentMsgOnlyChild;
  StringChildMsgParent: StringChildMsgParent;
  StringChildMsg: StringChildMsg;
  StringBothMsgParent: StringBothMsgParent;
  StringBothMsgChild: StringBothMsgChild;
  NonInfiniteNumber: NonInfiniteNumber;
  NegativeNumber: NegativeNumber;
  NonNegativeNumber: NonNegativeNumber;
  Rate: Rate;
  NumberParentNoMsg: NumberParentNoMsg;
  NumberChildNoMsg: NumberChildNoMsg;
  NumberParentMsgOnly: NumberParentMsgOnly;
  NumberParentMsgOnlyChild: NumberParentMsgOnlyChild;
  NumberChildMsgParent: NumberChildMsgParent;
  NumberChildMsg: NumberChildMsg;
  NumberBothMsgParent: NumberBothMsgParent;
  NumberBothMsgChild: NumberBothMsgChild;
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
    StringParentNoMsg: (input: string) => input.startsWith("string-parent-"),
    StringChildNoMsg: {
      validator: (input: string) => input.endsWith("-child"),
    },
    StringParentMsgOnly: {
      validator: (input: string) => input.startsWith("string-parent-msg-"),
      errorMessage: () => "expected parent string rule",
    },
    StringParentMsgOnlyChild: {
      validator: (input: string) => input.endsWith("-child"),
    },
    StringChildMsgParent: (input: string) => input.startsWith("string-child-msg-"),
    StringChildMsg: {
      validator: (input: string) => input.endsWith("-child"),
      errorMessage: () => "expected child string rule",
    },
    StringBothMsgParent: {
      validator: (input: string) => input.startsWith("string-both-msg-"),
      errorMessage: () => "expected parent string rule",
    },
    StringBothMsgChild: {
      validator: (input: string) => input.endsWith("-child"),
      errorMessage: () => "expected child string rule",
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
    NumberParentNoMsg: (input: number) => input > 0,
    NumberChildNoMsg: {
      validator: (input: number) => input < 10,
    },
    NumberParentMsgOnly: {
      validator: (input: number) => input > 0,
      errorMessage: () => "expected parent number rule",
    },
    NumberParentMsgOnlyChild: {
      validator: (input: number) => input < 10,
    },
    NumberChildMsgParent: (input: number) => input > 0,
    NumberChildMsg: {
      validator: (input: number) => input < 10,
      errorMessage: () => "expected child number rule",
    },
    NumberBothMsgParent: {
      validator: (input: number) => input > 0,
      errorMessage: () => "expected parent number rule",
    },
    NumberBothMsgChild: {
      validator: (input: number) => input < 10,
      errorMessage: () => "expected child number rule",
    },
  },
});
