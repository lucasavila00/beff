// Types for the behavioral test suite. The suite in ../tests/cases.ts checks what the generated
// validators do, never how they are generated, so it can run against any beff.json configuration.
//
// `buildCodecs` takes the generated module as an argument instead of importing it, so every
// configuration (one beff.json each, with its own outputDir) can build codecs from these same types.
import type {
  BuildParserFunction,
  NumberFormat,
  NumberFormatExtends,
  StringFormat,
  StringFormatExtends,
} from "@beff/client";

// Primitives and literals

export enum Color {
  Red = "red",
  Green = "green",
}

// Objects and optionality

type Nested = { inner: { deep: { value: number } }; list: { id: string }[] };
type ManyFields = {
  f01: string;
  f02: number;
  f03: boolean;
  f04: string;
  f05: number;
  f06: boolean;
  f07: string;
  f08: number;
  f09: boolean;
  f10: string;
  f11: number;
  f12: boolean;
  f13: string;
  f14: number;
  f15: boolean;
  f16: string;
  f17: number;
  f18: boolean;
  f19: string;
  f20: number;
};
type Optionals = {
  req: string;
  opt?: string;
  undef: string | undefined;
  voided: string | void;
  nul: string | null;
};

// Records and index signatures

type NumberKeyedObj = { [k: number]: boolean };
type TplIndexWithProps = { a: number; [k: `x_${string}`]: number };
type MetaKey = "alpha" | `beta_${string}`;

// Unions

type ObjA = { a: string };
type ObjB = { b: number };
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; size: number }
  | { kind: "rect"; w: number; h: number };
type NestedDiscriminated =
  | { type: "a"; subType: "a1"; a1: string }
  | { type: "a"; subType: "a2"; a2: string }
  | { type: "b"; value: number };
type ProtoDiscriminated =
  | { kind: "toString"; a: string }
  | { kind: "constructor"; b: number }
  | { kind: "__proto__"; c: boolean };
type MultiValueDiscriminated = { type: "a" | "c"; a: string } | { type: "b"; b: number };
type OptionalDiscriminated = { type: "a"; a: string } | { type?: "d"; d: number };

// Intersections

type IA = { a: string };
type IB = { b?: number };
type IntersectionUnion = IA & ({ kind: "u"; u: string } | { kind: "v"; v?: number });

// Utility types

type Base = { a: string; b: number; c?: boolean };
type ShapeKind = Shape["kind"];

// Generics

type Box<T> = { value: T };
type Pair<A, B = string> = { first: A; second: B };
type ListOf<A, B = A[]> = { item: A; items: B };
interface WithDefault<A, B = A[]> {
  a: A;
  b: B;
}
type GenericRecursive<T> = { value: T; children: GenericRecursive<T>[] };

// Recursion

type LinkedList = { value: number; next: LinkedList | null };
type Tree = { name: string; children: Tree[] };
type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
type Expr = { op: "num"; value: number } | { op: "add"; left: Expr; right: Expr } | { op: "neg"; arg: Expr };
type MutualA = { b?: MutualB; tag: "a" };
type MutualB = { a?: MutualA; tag: "b" };
type RecursiveFirst = RecursiveFirst[] | string;
type RecursiveMiddle = number | { child: RecursiveMiddle } | null;
type RecursiveLast = string | number | RecursiveLast[];
type RecursiveInTuple = [number, RecursiveInTuple | null];

// Formats

export type UserId = StringFormat<"UserId">;
export type AdminId = StringFormatExtends<UserId, "AdminId">;
export type NonNegative = NumberFormat<"NonNegative">;
export type Rate = NumberFormatExtends<NonNegative, "Rate">;

export const buildCodecs = (parse: { buildParsers: BuildParserFunction }) =>
  parse.buildParsers<{
    // Primitives
    String: string;
    Number: number;
    Boolean: boolean;
    Null: null;
    Undefined: undefined;
    Void: void;
    Any: any;
    Unknown: unknown;
    BigInt: bigint;
    DateT: Date;

    // Literals
    LitString: "hello";
    LitNumber: 42;
    LitTrue: true;
    LitUnion: "a" | "b" | "c";
    LitMixedUnion: "a" | 1 | true | null;
    ProtoLitUnion: "__proto__" | "toString" | "constructor";
    Enum: Color;
    EnumMember: Color.Red;

    // Arrays and tuples
    StringArray: string[];
    ReadonlyNumberArray: readonly number[];
    NestedArray: number[][];
    Tuple: [string, number];
    TupleRest: [string, ...number[]];
    ReadonlyTuple: readonly [boolean, string];

    // Objects
    Empty: {};
    Nested: Nested;
    ManyFields: ManyFields;
    Optionals: Optionals;
    ProtoKeyObject: { __proto__: string; toString: number };

    // Records and index signatures
    StringRecord: Record<string, number>;
    NumberRecord: Record<number, string>;
    NumberKeyedObj: NumberKeyedObj;
    LiteralKeyRecord: Record<"x" | "y", number>;
    NumberLiteralKeyRecord: Record<1 | 2, string>;
    PartialRecord: Partial<Record<"x" | "y", number>>;
    TplRecord: Record<`x_${string}`, number>;
    TplIndexWithProps: TplIndexWithProps;
    MetaRecord: Partial<Record<MetaKey, string>>;
    MappedType: { [K in "a" | "b"]: { value: K } };

    // Unions
    PrimitiveUnion: string | number;
    ObjectUnion: ObjA | ObjB;
    MixedUnion: string | ObjA | number[] | null;
    Shape: Shape;
    NestedDiscriminated: NestedDiscriminated;
    ProtoDiscriminated: ProtoDiscriminated;
    MultiValueDiscriminated: MultiValueDiscriminated;
    OptionalDiscriminated: OptionalDiscriminated;
    MapOrSetUnion: Map<string, number> | Set<string> | null;

    // Intersections
    Intersection: IA & IB;
    IntersectionNested: IA & (IB & { n: { x: string } });
    IntersectionIndex: IA & { n: number } & Record<string, string | number>;
    IntersectionTplIndex: IA & Record<`x_${string}`, number>;
    IntersectionUnion: IntersectionUnion;
    // An intersection as a member of a union that has a kind table.
    IntersectionDateOrNull: (Date & { foo: string }) | null;
    IntersectionNullishOrString: ((IA | null) & (IB | undefined)) | string;

    // Utility types
    OmitT: Omit<Base, "b">;
    PickT: Pick<Base, "a" | "c">;
    PartialT: Partial<Base>;
    RequiredT: Required<Base>;
    ExcludeT: Exclude<Shape, { kind: "circle" }>;
    ExcludeLit: Exclude<"a" | "b" | "c", "b">;
    KeyofT: keyof Base;
    IndexedAccess: ShapeKind;

    // Generics
    BoxString: Box<string>;
    BoxBox: Box<Box<number>>;
    PairDefault: Pair<number>;
    PairExplicit: Pair<number, boolean>;
    ListOfDefault: ListOf<number>;
    WithDefault: WithDefault<boolean>;
    GenericRecursive: GenericRecursive<string>;

    // Recursion
    LinkedList: LinkedList;
    Tree: Tree;
    Json: Json;
    Expr: Expr;
    MutualA: MutualA;
    RecursiveFirst: RecursiveFirst;
    RecursiveMiddle: RecursiveMiddle;
    RecursiveLast: RecursiveLast;
    RecursiveInTuple: RecursiveInTuple;

    // Template literals
    TplPrefix: `a${string}`;
    TplNumber: `${number}`;
    TplVersion: `${number}.${number}.${number}`;
    TplSize: `${number}x${number}`;
    TplLitUnion: `${"a" | "b"}-${number}`;
    TplBoolean: `${boolean}`;
    TplString: `${string}`;
    TplEnum: `${Color}`;

    // Formats
    UserId: UserId;
    AdminId: AdminId;
    NonNegative: NonNegative;
    Rate: Rate;
    FormatsInObject: { id: UserId; rate: Rate };

    // Built-in classes
    MapT: Map<string, number>;
    SetT: Set<string>;
    MapInObject: { m: Map<string, Date> };
    Uint8ArrayT: Uint8Array;
    Int32ArrayT: Int32Array;
    Float64ArrayT: Float64Array;
    BigInt64ArrayT: BigInt64Array;
    DateInObject: { at: Date; big: bigint };
  }>({
    stringFormats: {
      UserId: (input: string) => input.startsWith("user_"),
      AdminId: (input: string) => input.includes("_admin_"),
    },
    numberFormats: {
      NonNegative: (input: number) => input >= 0,
      Rate: (input: number) => input <= 1,
    },
  });

export type Codecs = ReturnType<typeof buildCodecs>;
