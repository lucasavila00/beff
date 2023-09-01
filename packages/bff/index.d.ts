import { Context as HonoContext, Env } from "hono";

export type Header<T> = T;
export type Cookie<T> = T;

export type Ctx<T = {}, E extends Env = any> = T & { hono: HonoContext<E> };
