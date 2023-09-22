import {
  BuildClientOptions,
  ClientFromRouter,
  buildClient,
} from "@beff/client";
import {
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
  useQuery,
  useMutation,
} from "@tanstack/react-query";

export type QueryHookResult<T> = {
  useQuery: (
    options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">
  ) => UseQueryResult<T>;
  fetch: () => Promise<T>;
};

export type GetHook<T> = T extends (...args: infer A) => Promise<infer R>
  ? (...args: A) => QueryHookResult<R>
  : never;

export type MutationHookResult<T> = {
  useMutation: (
    options?: Omit<UseMutationOptions<T>, "queryKey" | "queryFn">
  ) => UseMutationResult<T>;

  useQuery: (
    options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">
  ) => UseQueryResult<T>;

  fetch: () => Promise<T>;
};
export type NonGetHook<T> = T extends (...args: infer A) => Promise<infer R>
  ? (...args: A) => MutationHookResult<R>
  : never;

export type ReactQueryClient<T> = {
  [P in keyof T]: {
    [M in keyof T[P] as M extends `get` ? M : never]: GetHook<T[P][M]>;
  } & {
    [M in keyof T[P] as M extends `get` ? never : M]: NonGetHook<T[P][M]>;
  };
};

export const buildReactQueryClient = <T>(
  options: BuildClientOptions
): ReactQueryClient<ClientFromRouter<T>> => {
  const httpClient = buildClient<T>(options);
  const { generated } = options;

  const queryClient: any = {};

  for (const meta of generated.meta) {
    if (queryClient[meta.pattern] == null) {
      queryClient[meta.pattern] = {};
    }

    const fetcher = (httpClient as any)[meta.pattern][meta.method_kind];

    if (meta.method_kind == "get") {
      queryClient[meta.pattern][meta.method_kind] = (...params: any[]) => ({
        fetch: () => fetcher(params),
        useQuery: (options: any) =>
          useQuery({
            ...(options ?? {}),
            queryFn: async () => await fetcher(...params),
            queryKey: [meta.pattern, meta.method_kind, ...params],
          }),
      });
    } else {
      queryClient[meta.pattern][meta.method_kind] = (...params: any[]) => ({
        fetch: () => fetcher(params),
        useQuery: (options: any) =>
          useQuery({
            ...(options ?? {}),
            queryFn: async () => await fetcher(...params),
            queryKey: [meta.pattern, meta.method_kind, ...params],
          }),
        useMutation: (options: any) =>
          useMutation({
            ...(options ?? {}),
            mutationFn: async () => await fetcher(...params),
            mutationKey: [meta.pattern, meta.method_kind, ...params],
          }),
      });
    }
  }
  return queryClient;
};
