import parse from "../src/generated/parser";
import { buildCodecs } from "../src/parser";
import { defineBehaviorSuite } from "./cases";

defineBehaviorSuite(buildCodecs(parse), "Default");
