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

type OpenApiCompatRecordPayload = {
  payload: Record<string, unknown>;
};

type OpenApiCompatOptionalizedPayload = {
  maybeText: string | null;
  maybeEnum: "fallback" | "primary" | null;
  onlyNull: null;
  optional?: string;
  orUndefined: string | undefined;
};

type OpenApiCompatOptinal = {
  it?: string;
};

type OpenApiCompatDiscUnion =
  | {
      type: "CRON";
      schedule: string;
    }
  | {
      type: "EVENT";
      eventName: string;
    };

type OpenApiCompatDiscUnionCron = {
  type: "CRON";
  schedule: string;
};

type OpenApiCompatDiscUnionEvent = {
  type: "EVENT";
  eventName: string;
};

type OpenApiCompatDiscUnionAndNamedTypes = OpenApiCompatDiscUnionCron | OpenApiCompatDiscUnionEvent;
type WorkflowSourceBase = {
  id: string;
  workflowID: string;
  type: "CRON" | "EVENT";
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CronWorkflowSource = WorkflowSourceBase & {
  type: "CRON";
  cronExpression: string;
  eventName: string | undefined;
};

export type EventWorkflowSource = WorkflowSourceBase & {
  type: "EVENT";
  cronExpression: string | undefined;
  eventName: string;
};

export type WorkflowSource = CronWorkflowSource | EventWorkflowSource;
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
  OpenApiCompatRecordPayload: OpenApiCompatRecordPayload;
  OpenApiCompatOptionalizedPayload: OpenApiCompatOptionalizedPayload;
  OpenApiCompatOptinal: OpenApiCompatOptinal;
  OpenApiCompatDiscUnion: OpenApiCompatDiscUnion;
  OpenApiCompatDiscUnionCron: OpenApiCompatDiscUnionCron;
  OpenApiCompatDiscUnionEvent: OpenApiCompatDiscUnionEvent;
  OpenApiCompatDiscUnionAndNamedTypes: OpenApiCompatDiscUnionAndNamedTypes;
  WorkflowSource: WorkflowSource;
}>();
