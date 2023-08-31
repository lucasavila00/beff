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
export type NormalizeRouterItem<T> = T extends (...args: infer I) => Promise<infer O> ? [I, O] : T extends (...args: infer I) => infer O ? [I, O] : never;
type RemoveFirstOfTuple<T extends any[]> = T["length"] extends 0 ? [] : T extends [any, ...infer U] ? U : T;
export type SimpleHttpFunction<M extends [any[], any]> = (...args: RemoveFirstOfTuple<M[0]>) => Promise<M[1]>;
export type ClientFromRouter<R> = {
    [K in keyof R]: {
        [M in keyof R[K]]: SimpleHttpFunction<NormalizeRouterItem<R[K][M]>>;
    };
};
export declare class BffRequest {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";
    url: string;
    headers: Record<string, string>;
    cookies: string[];
    requestBodyStringified?: string;
    constructor(method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS", url: string, headers: Record<string, string>, cookies: string[], requestBodyStringified?: string);
}
export declare function buildStableClient<T>(fetcher: (url: BffRequest) => Promise<any>): ClientFromRouter<T>;
export declare const buildHonoTestClient: <T>(app: Hono<any, any, any>, env: any, executionContext?: any) => ClientFromRouter<T>;
export {};
