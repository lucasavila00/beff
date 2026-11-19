import parse from "../src/all-functions-generated/parser";
import { buildCodecs } from "../src/parser";
import { defineBehaviorSuite } from "./cases";

defineBehaviorSuite(buildCodecs(parse), "AllFunctions");
