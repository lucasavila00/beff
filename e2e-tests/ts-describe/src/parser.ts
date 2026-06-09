import parse from "./generated/parser";
import { StringFormat } from "@beff/client";

export type ValidCurrency = StringFormat<"ValidCurrency">;

/**
 * CompactId represents a formatted identifier
 * while keeping generated schemas small.
 */
type CompactId = StringFormat<"CompactId">;

type DocumentedSearchInput = {
  item: CompactId;
  /** Optional numeric cursor for paged lookup. */
  cursor: undefined | number;
};

type EntityId = string;

/** A selectable hierarchy entry that resolves to a list of target entities. */
type HierarchySelection = { _tag: "entityId"; entityId: EntityId };

type T1 = {
  a: string;
  b: number;
};

/** Documented payload for TypeScript descriptions. */
type DocumentedPayload = {
  /** Stable payload id. */
  id: string;
  /** Optional retry count. */
  retries?: number;
};

/** Documented result with nullable and required fields. */
type DocumentedResult = {
  /** Optional display label. */
  alpha: null | string;
  /** Stable lookup key. */
  beta: string;
};

/** Anonymous single-line alias. */
type JsdocSingleLineAlias = string;

/**
 * Anonymous multiline object.
 *
 * Keeps an intentional blank line.
 */
type JsdocMultilineObject = {
  /** First documented field. */
  first: string;
  /** Second documented field. */
  second: number;
};

type JsdocMemberOnlyObject = {
  /** Nullable first field. */
  alpha: null | string;
  /** Required second field. */
  beta: string;
  /** Optional third field. */
  gamma?: number;
};

type JsdocNestedObject = {
  /** Nested value. */
  nested: {
    /** Inner enabled flag. */
    enabled: boolean;
  };
};

/**
 * Reusable documented token.
 */
type JsdocReusableToken = StringFormat<"JsdocReusableToken">;

type JsdocReferencesDocumentedAlias = {
  token: JsdocReusableToken;
};

type JsdocUnionVariant =
  | {
      kind: "left";
      /** Left variant value. */
      value: string;
    }
  | {
      kind: "right";
      /** Right variant count. */
      count: number;
    };

type JsdocIgnoredCommentObject = {
  /* Plain block comment. */
  plain: string;
  // Plain line comment.
  line: number;
};

/** Not attached to the next type. */
const jsdocUnrelatedValue = 1;
type JsdocAfterUnrelatedValue = string;

type T2 = {
  t1: T1;
};

type T3 = {
  t2Array: T2[];
};

type InvalidSchemaWithDate = {
  x: Date;
};

type InvalidSchemaWithBigInt = {
  x: bigint;
};
type DiscriminatedUnion =
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

type RecursiveTree = {
  value: number;
  children: RecursiveTree[];
};

type SemVer = `${number}.${number}.${number}`;

type NonEmptyString = [string, ...string[]];

type ReusesRef = {
  a: T3;
  b: T3;
};

type GenericWrapper<T> = {
  value: T;
  value2: T | boolean;
  other: GenericWrapper<T>;
};

type UsesGenericWrapper = {
  wrappedString: GenericWrapper<string>;
  wrappedNumber: GenericWrapper<number>;
};

type DataWrapper<T> = {
  value: T;
};
type StringWrapped = DataWrapper<string>;
type NumberWrapped = DataWrapper<number>;

type UsesWrappeds = {
  x1: StringWrapped;
  x2: NumberWrapped;
  x3: DataWrapper<boolean>;
  x4: StringWrapped;
  x5: NumberWrapped;
  x6: DataWrapper<boolean>;
};
type UsesWrappedsComplex = {
  x3: DataWrapper<{ a: boolean }>;
  x6: DataWrapper<{ a: boolean }>;
};
type ABool = { a: boolean };
type UsesWrappedsComplexRef = {
  x3: DataWrapper<ABool>;
  x6: DataWrapper<ABool>;
};
export const Codecs = parse.buildParsers<{
  // basic
  string: string;
  number: number;
  boolean: boolean;
  null: null;
  undefined: undefined;
  object: object;
  anyArray: any[];
  any: any;
  //
  T1: T1;
  DocumentedPayload: DocumentedPayload;
  DocumentedResult: DocumentedResult;
  JsdocSingleLineAlias: JsdocSingleLineAlias;
  JsdocMultilineObject: JsdocMultilineObject;
  JsdocMemberOnlyObject: JsdocMemberOnlyObject;
  JsdocNestedObject: JsdocNestedObject;
  JsdocReferencesDocumentedAlias: JsdocReferencesDocumentedAlias;
  JsdocUnionVariant: JsdocUnionVariant;
  JsdocIgnoredCommentObject: JsdocIgnoredCommentObject;
  JsdocAfterUnrelatedValue: JsdocAfterUnrelatedValue;
  T2: T2;
  T3: T3;
  InvalidSchemaWithDate: InvalidSchemaWithDate;
  InvalidSchemaWithBigInt: InvalidSchemaWithBigInt;
  DiscriminatedUnion: DiscriminatedUnion;
  RecursiveTree: RecursiveTree;
  SemVer: SemVer;
  NonEmptyString: NonEmptyString;
  //
  ValidCurrency: ValidCurrency;
  DocumentedSearchInput: DocumentedSearchInput;
  HierarchySelection: HierarchySelection;
  ReusesRef: ReusesRef;
  UsesGenericWrapper: UsesGenericWrapper;
  StringWrapped: StringWrapped;
  NumberWrapped: NumberWrapped;
  UsesWrappeds: UsesWrappeds;
  UsesWrappedsComplex: UsesWrappedsComplex;
  UsesWrappedsComplexRef: UsesWrappedsComplexRef;
}>({
  stringFormats: {
    ValidCurrency: (input: string) => {
      if (input === "USD") {
        return true;
      }
      return false;
    },
    CompactId: (_input: string) => true,
    JsdocReusableToken: (_input: string) => true,
  },
});
