import * as D from "./abc";
import E from "./def";
import { router5 } from "./r5";
import { Router6, Router7 } from "./r6";
import { r11 } from "./r11";
import { r13 } from "./r13";
import A2 from "./def";
import { A3 } from "./def";
import * as A4 from "./r6";

export default {
  [`/123`]: {
    get: async (): Promise<r13["ads"]> => {
      return "test";
    },
  },
  [`/1234`]: {
    get: async (): Promise<r13.asd> => {
      return "test";
    },
  },
  [`/hello`]: {
    get: async (): Promise<ThisDoesNotExist> => {
      return "test";
    },
  },
  "/a2": {
    get: (): D => {
      return "";
    },
  },
  "/a3": {
    get: (): E => {
      return "";
    },
  },
  "/a4": {
    get: (): typeof A => {
      return "";
    },
  },
  "/a5": {
    get: (): typeof A2 => {
      return "";
    },
  },
  "/a6": {
    get: (): typeof A3 => {
      return "";
    },
  },
  "/a7": {
    get: (): typeof A4 => {
      return "";
    },
  },
  ...router5.router5Nested,
  ...Router6,
  ...Router7,
  ...Router6.x,
  ...Router7.x,
  ...Router6.a.b.c.d,
  ...Router7.a.b.c.d,
  ...E,
  ...E.a,
  ...E["a"],
  ...D,
  ...D.a,
  ...D["a"],
  ...r11,
  ...r13,
};
