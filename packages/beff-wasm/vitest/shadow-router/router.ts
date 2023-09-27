import { Ctx } from "@beff/hono";

export default {
  "/a": {
    post: (): string => {
      return "a";
    },
  },
  "/a/b": {
    post: (): string => {
      return "b";
    },
  },
  "/c/d": {
    post: (): string => {
      return "d";
    },
  },
  "/c": {
    post: (): string => {
      return "c";
    },
  },
  "/aa/{rest}": {
    post: (_c: Ctx, rest: string): string => {
      return "aa" + rest;
    },
  },
  "/aa/bb": {
    post: (): string => {
      return "bb";
    },
  },
  "/cc/dd": {
    post: (): string => {
      return "dd";
    },
  },
  "/cc/{rest}": {
    post: (_c: Ctx, rest: string): string => {
      return "cc" + rest;
    },
  },
};
