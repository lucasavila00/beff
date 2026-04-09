import parse from "./generated/parser";

type Address = {
  street: string;
  city: string;
};

type User = {
  id: string;
  address: Address;
  profile: {
    displayName: string;
  };
};

type CreateUserRequest = {
  user: User;
  metadata: {
    source: string;
  };
};

type CreateUserResponse = {
  user: User;
};

type UpdateUserRequest = {
  id: string;
  address: Address;
};

type SearchUsersResponse = {
  items: User[];
  primaryAddress: Address;
};

type RecursiveTree = {
  value: string;
  children: RecursiveTree[];
};

type RecursiveEnvelope = {
  root: RecursiveTree;
  previous?: RecursiveEnvelope;
};

type OpenApiCompatConstPayload = {
  status: "ok";
  retries: 3;
  enabled: true;
  nullable: null;
};

type OpenApiCompatEnumPayload = {
  role: "admin" | "member";
  code: 200 | 201;
  enabled: true | false;
  mixed: "fallback" | 0 | null;
};

export const Codecs = parse.buildParsers<{
  Address: Address;
  User: User;
  CreateUserRequest: CreateUserRequest;
  CreateUserResponse: CreateUserResponse;
  UpdateUserRequest: UpdateUserRequest;
  SearchUsersResponse: SearchUsersResponse;
  RecursiveTree: RecursiveTree;
  RecursiveEnvelope: RecursiveEnvelope;
  OpenApiCompatConstPayload: OpenApiCompatConstPayload;
  OpenApiCompatEnumPayload: OpenApiCompatEnumPayload;
}>();
