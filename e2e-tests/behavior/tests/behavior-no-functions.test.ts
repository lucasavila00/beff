import parse from "../src/no-functions-generated/parser";
import { buildCodecs } from "../src/parser";
import { defineBehaviorSuite } from "./cases";

defineBehaviorSuite(buildCodecs(parse), "NoFunctions");
