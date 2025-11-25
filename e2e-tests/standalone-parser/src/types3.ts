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

export type CurrencyPrices = Record<ValidCurrency, Rate>;

const receivesUser = (userId: UserId) => {
  // ...
};
const receivesReadAuthorizedUser = (userId: ReadAuthorizedUserId) => {
  // ...
};
const receivesWriteAuthorizedUser = (userId: WriteAuthorizedUserId) => {
  // ...
};

export const testFunction = () => {
  const userId = "user_123" as UserId;
  const readAuthorizedUserId = "user_123" as ReadAuthorizedUserId;
  const writeAuthorizedUserId = "user_123" as WriteAuthorizedUserId;

  receivesUser(userId);
  receivesReadAuthorizedUser(readAuthorizedUserId);
  receivesWriteAuthorizedUser(writeAuthorizedUserId);

  receivesUser(readAuthorizedUserId);
  receivesUser(writeAuthorizedUserId);

  receivesReadAuthorizedUser(writeAuthorizedUserId);

  //@ts-expect-error
  receivesReadAuthorizedUser(userId);
  //@ts-expect-error
  receivesWriteAuthorizedUser(userId);
  //@ts-expect-error
  receivesWriteAuthorizedUser(readAuthorizedUserId);

  //@ts-expect-error
  receivesUser("invalid_user_id" as string);
};
