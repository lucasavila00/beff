import parse from "./generated/parser";
import { Arr2, OtherEnum, ValidCurrency, OtherEnum2, Arr3 } from "./types";
import * as T4 from "./types4";
import { b } from "./types4";

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

export type AvatarSize = `${number}x${number}`;
export type AccessLevelTpl = `${AccessLevel}`;

export enum AccessLevel2 {
  ADMIN = "ADMIN Admin",
  USER = "USER User",
}
export type AccessLevelTpl2 = `${AccessLevel2}`;

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

export type T3 = Exclude<Shape, { kind: "circle" }>;

type Version = `${number}.${number}.${number}`;
type Version2 = `v${number}.${number}.${number}`;

export type AObject = {
  tag: typeof T4.a;
};

export type BObject = { tag: typeof b };

const ImportEnumTypeof = {
  A: OtherEnum.A,
} as const;

export type ABC = {};
export type KABC = keyof ABC;

export type DEF = {
  a: string;
};
export type KDEF = keyof DEF;

export type K = KABC | KDEF;

export type TransportedValue = string | null | undefined | Array<string | number | null | undefined>;

export const {
  Version,
  Version2,
  RequiredPartialObject,
  LevelAndDSettings,
  ImportEnumTypeof: ImportEnumTypeofCodec,
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
  AccessLevelCodec,
  T3,
  AvatarSize,
  AccessLevelTpl,
  AccessLevelTpl2,
  AObject,
  BObject,
  AllTs,
  TransportedValue,
  BigIntCodec: BigIntCodec,
  TupleCodec: TupleCodec,
  TupleCodecRest: TupleCodecRest,
} = parse.buildParsers<{
  TransportedValue: TransportedValue;
  BigIntCodec: bigint;
  TupleCodec: [number, number, number];
  TupleCodecRest: [number, number, ...string[]];
  AllTs: T4.AllTs;
  AObject: AObject;
  Version: Version;
  Version2: Version2;
  AccessLevelTpl2: AccessLevelTpl2;
  AccessLevelTpl: AccessLevelTpl;
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
  AccessLevelCodec: AccessLevel;
  AvatarSize: AvatarSize;
  BObject: BObject;
  ImportEnumTypeof: typeof ImportEnumTypeof;
  KDEF: KDEF;
  KABC: KABC;
  K: K;
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
