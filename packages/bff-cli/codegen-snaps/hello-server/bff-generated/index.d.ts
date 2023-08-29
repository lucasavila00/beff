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
export type NormalizeRouterItem<T> = T extends (...deps: any) => (...args: infer I) => Promise<infer O> ? [I, O] : T extends (...args: infer I) => Promise<infer O> ? [I, O] : T extends (...args: infer I) => infer O ? [I, O] : never;
export type SimpleHttpFunction<M extends [any[], any]> = (...args: M[0]) => Promise<M[1]>;
export type ClientFromRouter<R> = {
    [K in keyof R]: {
        [M in keyof R[K]]: SimpleHttpFunction<NormalizeRouterItem<R[K][M]>>;
    };
};
type Response = any;
type RequestInit = any;
export declare function buildFetchClient(fetcher: (url: string, info: RequestInit) => Response | Promise<Response>, options: {
    baseUrl: string;
}): any;
export {};
