import { Hono } from "hono";
type OpenApiServer = any;
export declare function registerRouter(options: {
    app: Hono<any, any, any>;
    router: any;
    openApi?: {
        servers: OpenApiServer[];
    };
}): void;
type Decoder<T> = {
    parse: (value: unknown) => T;
};
type DecodersOfKV<T> = {
    [K in keyof T]: Decoder<T[K]>;
};
export declare const buildDecoders: <T>() => DecodersOfKV<T>;
export type Header<T> = T;
export type Cookie<T> = T;
export declare const todo: <T>() => T;
export type NormalizeRouter<T> = T extends (...deps: any) => (...args: infer I) => Promise<infer O> ? [I, O] : T extends (...args: infer I) => Promise<infer O> ? [I, O] : never;
export type SimpleHttpClient<M extends Record<string, [[...any[]], any]>> = {
    [K in keyof M]: (...args: M[K][0]) => Promise<M[K][1]>;
};
export {};
