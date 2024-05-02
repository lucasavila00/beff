import parse from "./generated/parser";
type Shape =
| { kind: "circle"; radius: number }
| { kind: "square"; x: number }
| { kind: "triangle"; x: number; y: number };

type T3 = Exclude<Shape, { kind: "circle" }>

export const Codecs = parse.buildParsers<{ T3:T3 }>();
