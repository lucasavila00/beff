import type { HandlerMeta } from "bff-types";
export type NormalizeRouterItem<T> = T extends (
  ...args: infer I
) => Promise<infer O>
  ? [I, O]
  : T extends (...args: infer I) => infer O
  ? [I, O]
  : never;
type RemoveFirstOfTuple<T extends any[]> = T["length"] extends 0
  ? []
  : T extends [any, ...infer U]
  ? U
  : T;
export type SimpleHttpFunction<M extends [any[], any]> = (
  ...args: RemoveFirstOfTuple<M[0]>
) => Promise<M[1]>;

export type ClientFromRouter<R> = {
  [K in keyof R as K extends `${string}*${string}` ? never : K]: {
    [M in keyof R[K] as M extends `use` ? never : M]: SimpleHttpFunction<
      NormalizeRouterItem<R[K][M]>
    >;
  };
};

export class BffRequest {
  public method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";
  public url: string;
  public headers: Record<string, string>;
  public cookies: string[];
  public requestBodyStringified?: string;
  constructor(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS",
    url: string,
    headers: Record<string, string>,
    cookies: string[],
    requestBodyStringified?: string
  ) {
    this.method = method.toUpperCase() as any;
    this.url = url;
    this.headers = headers;
    this.cookies = cookies;
    this.requestBodyStringified = requestBodyStringified;
  }
}

export function buildStableClient<T>(
  handlersMeta: HandlerMeta[],
  fetcher: (url: BffRequest) => Promise<any>
): ClientFromRouter<T> {
  const client: any = {};
  for (const meta of handlersMeta) {
    if (client[meta.pattern] == null) {
      client[meta.pattern] = {};
    }

    client[meta.pattern][meta.method_kind] = async (...params: any) => {
      let url = meta.pattern;
      const method = meta.method_kind.toUpperCase() as any;
      const init: Partial<BffRequest> = {};
      init.headers = {};
      init.headers["content-type"] = "application/json";
      let hasAddedQueryParams = false;

      const clientParams = meta.params.filter((it) => it.type != "context");

      for (let index = 0; index < clientParams.length; index++) {
        const metadata = clientParams[index];
        const param = params[index];
        switch (metadata.type) {
          case "path": {
            url = url.replace(`{${metadata.name}}`, param);
            break;
          }
          case "query": {
            if (!hasAddedQueryParams) {
              url += "?";
              hasAddedQueryParams = true;
            }
            url += `${metadata.name}=${param}&`;
            break;
          }
          case "header": {
            init.headers[metadata.name] = param;
            break;
          }
          case "cookie": {
            if (init.cookies == null) {
              init.cookies = [];
            }
            init.cookies.push(`${metadata.name}=${param}`);
            break;
          }
          case "body": {
            init.requestBodyStringified = JSON.stringify(param);
            break;
          }
          case "context": {
            // not a client parameter
            break;
          }
          default: {
            throw new Error("not implemented: " + metadata.type);
          }
        }
      }

      return await fetcher(
        new BffRequest(
          method,
          url,
          init.headers ?? {},
          init.cookies ?? [],
          init.requestBodyStringified
        )
      );
    };
  }
  return client;
}
