import parse from "./generated/parser";

type GenericWrapper<T> = {
  value: T;
  value2: T | boolean;
  other: GenericWrapper<T>;
};

type UsesGenericWrapper = {
  wrappedString: GenericWrapper<string>;
  wrappedNumber: GenericWrapper<number>;
};
parse.buildParsers<{ UsesGenericWrapper: UsesGenericWrapper }>();
