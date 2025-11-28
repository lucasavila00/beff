import {
  AfterRequired,
  BeforeRequired,
  KeyofAfterRequired,
  KeyofBeforeRequired,
} from "../tests/partial.test";
import { SomeChar, SomeString } from "../tests/string-indexed.test";
import parse from "./generated/parser";

export const Codecs = parse.buildParsers<{
  BeforeRequired: BeforeRequired;
  KeyofBeforeRequired: KeyofBeforeRequired;
  AfterRequired: AfterRequired;
  KeyofAfterRequired: KeyofAfterRequired;

  SomeString: SomeString;
  SomeChar: SomeChar;
}>({});
