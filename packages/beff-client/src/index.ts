import type { DecodeError, HandlerMetaServer } from "@beff/cli";
const prettyPrintValue = (it: unknown): string => {
  if (typeof it === "string") {
    return `"${it}"`;
  }
  if (typeof it === "number") {
    return `${it}`;
  }
  if (typeof it === "boolean") {
    return `${it}`;
  }
  if (it === null) {
    return "null";
  }
  if (Array.isArray(it)) {
    return `Array`;
  }
  if (typeof it === "object") {
    return `Object`;
  }
  return JSON.stringify(it);
};

const joinWithDot = (it: string[]): string => {
  if (it.length === 0) {
    return "";
  }
  let acc = it[0];
  for (const item of it.slice(1)) {
    // skip dot if first char is [
    if (item.startsWith("[")) {
      acc += item;
    } else {
      acc += "." + item;
    }
  }
  return acc;
};
export const printErrors = (it: DecodeError[], parentPath: string[]): string => {
  return it
    .map((err, idx) => {
      const mergedPath = [...parentPath, ...err.path];
      const path = mergedPath.length > 0 ? `(${joinWithDot(mergedPath)})` : "";

      const msg = [err.message, `received: ${prettyPrintValue(err.received)}`]
        .filter((it) => it.length > 0)
        .join(", ");

      return [`#${idx}`, path, msg].filter((it) => it.length > 0).join(" ");
    })
    .join(" | ");
};

// import { fetch, Request } from "@whatwg-node/fetch";
export type NormalizeRouterItem<T> = T extends (...args: infer I) => Promise<infer O>
  ? [I, O]
  : T extends (...args: infer I) => infer O
  ? [I, O]
  : never;
type RemoveFirstOfTuple<T extends any[]> = T["length"] extends 0 ? [] : T extends [any, ...infer U] ? U : T;

// inlining SimpleHttpFunction crates better hovered tooltip types
// export type SimpleHttpFunction<M extends [any[], any]> = (
//   ...args: RemoveFirstOfTuple<M[0]>
// ) => Promise<M[1]>;
// export type ClientFromRouter<R> = {
//   [K in keyof R as K extends `${string}*${string}` ? never : K]: {
//     [M in keyof R[K] as M extends `use` ? never : M]: SimpleHttpFunction<
//       NormalizeRouterItem<R[K][M]>
//     >;
//   };
// };
export type ClientFromRouter<R> = {
  [K in keyof R as K extends `${string}*${string}` ? never : K]: {
    [M in keyof R[K] as M extends `use` ? never : M]: (
      ...args: RemoveFirstOfTuple<NormalizeRouterItem<R[K][M]>[0]>
    ) => Promise<NormalizeRouterItem<R[K][M]>[1]>;
  };
};

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";

type ClientRequestParams = { meta: HandlerMetaServer; params: unknown[] };
export class BffRequest {
  public method: HTTPMethod;
  public path: string;
  public headers: Record<string, string>;
  public requestBodyStringified?: string;
  constructor(
    method: HTTPMethod,
    path: string,
    headers: Record<string, string>,
    requestBodyStringified?: string
  ) {
    this.method = method.toUpperCase() as any;
    this.path = path;
    this.headers = headers;
    this.requestBodyStringified = requestBodyStringified;
  }

  static build = (reqParams: ClientRequestParams): BffRequest => {
    const { meta, params } = reqParams;
    let path = meta.pattern;
    const method = meta.method_kind.toUpperCase() as any;
    const init: Partial<BffRequest> = {};
    init.headers = {};
    init.headers["content-type"] = "application/json";
    let hasAddedQueryParams = false;

    const clientParams = meta.params.filter((it) => it.type != "context");

    for (let index = 0; index < clientParams.length; index++) {
      const metadata = clientParams[index];
      const encoder = metadata.encoder;
      const validator = metadata.validator;
      const ctx: any = {};
      const validParams = validator(ctx, params[index]);
      if (ctx.errors != null) {
        throw new BffHTTPException(402, printErrors(ctx.errors, [metadata.name]));
      }

      const param = encoder(validParams);
      switch (metadata.type) {
        case "path": {
          path = path.replace(`{${metadata.name}}`, String(param));
          break;
        }
        case "query": {
          if (!metadata.required && param == null) {
            // skip optional query params
          } else {
            if (!hasAddedQueryParams) {
              path += "?";
              hasAddedQueryParams = true;
              path += `${metadata.name}=${param}`;
            } else {
              path += `&${metadata.name}=${param}`;
            }
          }
          break;
        }
        case "header": {
          if (!metadata.required && param == null) {
            // skip optional headers
          } else {
            init.headers[metadata.name] = String(param);
          }
          break;
        }
        case "body": {
          init.requestBodyStringified = JSON.stringify(param);
          break;
        }
        default: {
          throw new Error("Unknown type: " + metadata.type);
        }
      }
    }

    return new BffRequest(method, path, init.headers ?? {}, init.requestBodyStringified);
  };

  toRequestInit(): RequestInit {
    return {
      method: this.method,
      headers: this.headers,
      body: this.requestBodyStringified,
    };
  }
}

// export interface ClientPlugin {
//   onRequestInit?: OnRequestInitHook;
//   onFetch?: OnFetchHook;
//   onResponse?: OnResponseHook;
// }

// export type OnRequestInitHook = (
//   payload: ClientOnRequestInitPayload
// ) => Promise<void> | void;
// export type OnFetchHook = (
//   payload: ClientOnFetchHookPayload
// ) => Promise<void> | void;
// export type OnResponseHook = (
//   payload: ClientOnResponseHookPayload
// ) => Promise<void> | void;

// export interface ClientOnRequestInitPayload {
//   path: string;
//   method: HTTPMethod;
//   requestParams: ClientRequestParams;
//   requestInit: RequestInit;
//   // endResponse(response: Response): void;
// }

// export interface ClientOnFetchHookPayload {
//   url: string;
//   init: RequestInit;
//   fetchFn: typeof fetch;
//   setFetchFn(fetchFn: typeof fetch): void;
// }

// export interface ClientOnResponseHookPayload {
//   path: string;
//   method: HTTPMethod;
//   requestParams: ClientRequestParams;
//   requestInit: RequestInit;
//   response: Response;
// }
export type BuildClientOptions = {
  generated: { meta: HandlerMetaServer[] };
  fetchFn?: typeof fetch;
  baseUrl?: string;
  // plugins?: ClientPlugin[];
};

class BffHTTPException extends Error {
  isBeffHttpException: true;
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HTTPException";
    this.isBeffHttpException = true;
    this.status = status;
  }
}

export function buildClient<T>(options: BuildClientOptions): ClientFromRouter<T> {
  const {
    generated,
    fetchFn = fetch,
    baseUrl = "",
    //  plugins = []
  } = options;

  const endpoint = baseUrl;

  // const onRequestInitHooks: OnRequestInitHook[] = [];
  // const onFetchHooks: OnFetchHook[] = [];
  // const onResponseHooks: OnResponseHook[] = [];
  // for (const plugin of plugins) {
  //   if (plugin.onRequestInit) {
  //     onRequestInitHooks.push(plugin.onRequestInit);
  //   }
  //   if (plugin.onFetch) {
  //     onFetchHooks.push(plugin.onFetch);
  //   }
  //   if (plugin.onResponse) {
  //     onResponseHooks.push(plugin.onResponse);
  //   }
  // }

  const client: any = {};
  for (const meta of generated.meta) {
    if (client[meta.pattern] == null) {
      client[meta.pattern] = {};
    }
    client[meta.pattern][meta.method_kind.toLowerCase()] = async (...params: any) => {
      const requestParams = { meta, params };
      const bffReq = BffRequest.build(requestParams);
      const requestInit = bffReq.toRequestInit();
      const path = bffReq.path;
      // const method = bffReq.method;

      // let response: Response | undefined = undefined;
      // for (const onRequestParamsHook of onRequestInitHooks) {
      //   await onRequestParamsHook({
      //     path,
      //     method,
      //     requestParams,
      //     requestInit,
      //     // endResponse(res) {
      //     //   response = res;
      //     // },
      //   });
      // }
      // if (response) {
      //   return response;
      // }

      let finalUrl = path;
      if (endpoint && !path.startsWith("http")) {
        finalUrl = `${endpoint}${path}`;
      }

      const currentFetchFn = fetchFn;

      // for (const onFetchHook of onFetchHooks) {
      //   await onFetchHook({
      //     url: finalUrl,
      //     init: requestInit as RequestInit,
      //     fetchFn: currentFetchFn,
      //     setFetchFn(newFetchFn) {
      //       currentFetchFn = newFetchFn;
      //     },
      //   });
      // }

      const r = await currentFetchFn(new Request(finalUrl, requestInit));

      // for (const onResponseHook of onResponseHooks) {
      //   await onResponseHook({
      //     path,
      //     method,
      //     requestParams,
      //     requestInit,
      //     response: responseFetched,
      //   });
      // }

      if (r.ok) {
        const data = await r.json();
        const parser = meta.return_validator;
        const validatorCtx: any = {};

        return parser(validatorCtx, data);
      }
      const text = await r.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new BffHTTPException(r.status, text);
      }
      throw new BffHTTPException(r.status, json.message);
    };
  }
  return client;
}
// export const loggerPlugin: ClientPlugin = {
//   onRequestInit: async (payload) => {
//     console.log("Requesting", payload);
//   },
//   onResponse: async (payload) => {
//     console.log("Response", payload);
//   },
//   onFetch: async (payload) => {
//     console.log("Fetch", payload);
//   },
// };
