import parse from "./generated/parser";
import { Arr2, OtherEnum, ValidCurrency, OtherEnum2, Arr3 } from "./types";

export const ALL_TYPES = [
  "OmitSettings",
  "RequiredPartialObject",
  "LevelAndDSettings",
  "PartialSettings",
] as const;
export type AllTypes = (typeof ALL_TYPES)[number];

export enum AccessLevel {
  ADMIN = "ADMIN",
  USER = "USER",
}

type AvatarSize = `${number}x${number}`;
export type Extra = Record<string, string>;

export type User = {
  accessLevel: AccessLevel;
  name: string;
  friends: User[];
  avatarSize: AvatarSize;
  extra: Extra;
};

export type PublicUser = Omit<User, "friends">;

type WithOptionals = {
  optional?: string;
};

type Req = Required<WithOptionals>;

export interface Repro2 {
  useSmallerSizes: boolean;
}

export interface Repro1 {
  sizes?: Repro2;
}

export type Settings = {
  a: string;
  level: "a" | "b";
  d: {
    tag: "d";
  };
};

export type SettingsUpdate = Settings["a" | "level" | "d"];
export type Mapped = {
  [K in "a" | "b"]: {
    value: K;
  };
};
export type MappedOptional = {
  [K in "a" | "b"]?: {
    value: K;
  };
};

export type PartialSettings = Partial<Settings>;

export type LevelAndDSettings = Pick<Settings, "level" | "d">;

export type OmitSettings = Omit<Settings, "a">;

export type PartialObject = {
  a?: string;
  b?: number;
};

export type RequiredPartialObject = Required<PartialObject>;

export type DiscriminatedUnion =
  | {
      type: "a";
      subType: "a1";
      a1: string;
      a11?: string;
    }
  | {
      type: "a";
      subType: "a2";
      a2: string;
    }
  | {
      type: "b";
      value: number;
    };
export type DiscriminatedUnion3 =
  | {
      type: "a" | "c";
      a1: string;
    }
  | {
      type: "b";
      value: number;
    };
export type DiscriminatedUnion2 =
  | {
      type: "a";
      subType: "a1";
      a1: string;
      a11?: string;
    }
  | {
      type: "a";
      subType: "a2";
      a2: string;
    }
  | {
      type?: "d";
      valueD: number;
    }
  | {
      type: "b";
      value: number;
    };

export type DiscriminatedUnion4 =
  | {
      type: "a";
      a: {
        subType: "a1";
        a1: string;
      };
    }
  | {
      type: "a";
      a: {
        subType: "a2";
        a2: string;
      };
    };

type UnionWithEnumAccess =
  | {
      tag: OtherEnum.A;
      value: string;
    }
  | {
      tag: OtherEnum.B;
      value: number;
    }
  | {
      tag: OtherEnum2.C;
      value: boolean;
    };
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; x: number }
  | { kind: "triangle"; x: number; y: number };

type T3 = Exclude<Shape, { kind: "circle" }>;

export const {
  RequiredPartialObject,
  LevelAndDSettings,
  PartialSettings,
  Extra,
  User,
  PublicUser,
  Repro1,
  SettingsUpdate,
  Mapped,
  MappedOptional,
  OmitSettings,
  PartialObject,
  DiscriminatedUnion,
  DiscriminatedUnion2,
  DiscriminatedUnion3,
  DiscriminatedUnion4,
  Arr2C,
  ValidCurrency: ValidCurrencyCodec,
  UnionWithEnumAccess,
  T3,
} = parse.buildParsers<{
  Arr3: Arr3;
  OmitSettings: OmitSettings;
  RequiredPartialObject: RequiredPartialObject;
  LevelAndDSettings: LevelAndDSettings;
  PartialSettings: PartialSettings;
  Extra: Extra;
  User: User;
  PublicUser: PublicUser;
  Req: Req;
  Repro1: Repro1;
  SettingsUpdate: SettingsUpdate;
  Mapped: Mapped;
  MappedOptional: MappedOptional;
  PartialObject: PartialObject;
  DiscriminatedUnion: DiscriminatedUnion;
  DiscriminatedUnion2: DiscriminatedUnion2;
  DiscriminatedUnion3: DiscriminatedUnion3;
  DiscriminatedUnion4: DiscriminatedUnion4;
  AllTypes: AllTypes;
  AccessLevel: AccessLevel;
  OtherEnum: OtherEnum;
  Arr2C: Arr2;
  ValidCurrency: ValidCurrency;
  UnionWithEnumAccess: UnionWithEnumAccess;
  T3: T3;
}>({
  customFormats: {
    ValidCurrency: (input: string) => {
      if (input === "USD") {
        return true;
      }
      return false;
    },
  },
});
