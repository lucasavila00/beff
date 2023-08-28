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
type MethodMaker = <Elem extends string, Template extends readonly Elem[]>(template: Template, ..._args: []) => string;
export declare const GET: MethodMaker;
export declare const POST: MethodMaker;
export declare const PUT: MethodMaker;
export declare const DELETE: MethodMaker;
export declare const PATCH: MethodMaker;
export declare const HEAD: MethodMaker;
export declare const OPTIONS: MethodMaker;
export declare const USE: MethodMaker;
export type Header<T> = T;
export type Cookie<T> = T;
export declare const todo: <T>() => T;
export {};
