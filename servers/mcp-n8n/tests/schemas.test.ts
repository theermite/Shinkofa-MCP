import { describe, expect, it } from "vitest";
import {
  ChangeUserRoleSchema,
  CreateCredentialSchema,
  CreateTagSchema,
  CreateUsersSchema,
  CreateVariableSchema,
  CreateWorkflowSchema,
  GenerateAuditSchema,
  GetExecutionSchema,
  GetWorkflowSchema,
  ListExecutionsSchema,
  ListWorkflowsSchema,
  RawApiCallSchema,
  RetryExecutionSchema,
  RunWorkflowSchema,
  SetWorkflowTagsSchema,
  StopExecutionSchema,
  TransferCredentialSchema,
  UpdateTagSchema,
  UpdateVariableSchema,
  UpdateWorkflowSchema,
} from "../src/lib/schemas.js";

describe("Workflow schemas", () => {
  it("should_accept_valid_ListWorkflows", () => {
    expect(ListWorkflowsSchema.parse({ active: true, limit: 50 })).toBeDefined();
    expect(ListWorkflowsSchema.parse({})).toBeDefined();
  });

  it("should_reject_invalid_ListWorkflows_limit", () => {
    expect(() => ListWorkflowsSchema.parse({ limit: 0 })).toThrow();
    expect(() => ListWorkflowsSchema.parse({ limit: 300 })).toThrow();
  });

  it("should_accept_valid_GetWorkflow", () => {
    expect(GetWorkflowSchema.parse({ workflow_id: "123" })).toBeDefined();
  });

  it("should_reject_GetWorkflow_without_id", () => {
    expect(() => GetWorkflowSchema.parse({})).toThrow();
  });

  it("should_accept_valid_CreateWorkflow", () => {
    expect(CreateWorkflowSchema.parse({ name: "test", nodes: [], connections: {} })).toBeDefined();
  });

  it("should_reject_CreateWorkflow_empty_name", () => {
    expect(() => CreateWorkflowSchema.parse({ name: "", nodes: [], connections: {} })).toThrow();
  });

  it("should_accept_valid_UpdateWorkflow", () => {
    expect(UpdateWorkflowSchema.parse({ workflow_id: "1", name: "updated" })).toBeDefined();
  });

  it("should_accept_valid_RunWorkflow", () => {
    expect(RunWorkflowSchema.parse({ workflow_id: "1" })).toBeDefined();
    expect(RunWorkflowSchema.parse({ workflow_id: "1", data: { key: "val" } })).toBeDefined();
  });

  it("should_accept_valid_SetWorkflowTags", () => {
    expect(SetWorkflowTagsSchema.parse({ workflow_id: "1", tags: [{ id: "t1" }] })).toBeDefined();
  });
});

describe("Execution schemas", () => {
  it("should_accept_valid_ListExecutions", () => {
    expect(ListExecutionsSchema.parse({ status: "error", limit: 10 })).toBeDefined();
  });

  it("should_reject_invalid_status", () => {
    expect(() => ListExecutionsSchema.parse({ status: "invalid" })).toThrow();
  });

  it("should_accept_valid_GetExecution", () => {
    expect(GetExecutionSchema.parse({ execution_id: 42 })).toBeDefined();
  });

  it("should_accept_valid_RetryExecution", () => {
    expect(RetryExecutionSchema.parse({ execution_id: 1, loadWorkflow: true })).toBeDefined();
  });

  it("should_accept_valid_StopExecution", () => {
    expect(StopExecutionSchema.parse({ execution_id: 1 })).toBeDefined();
  });
});

describe("Credential schemas", () => {
  it("should_accept_valid_CreateCredential", () => {
    expect(CreateCredentialSchema.parse({ name: "gh", type: "githubApi", data: { token: "x" } })).toBeDefined();
  });

  it("should_reject_CreateCredential_empty_name", () => {
    expect(() => CreateCredentialSchema.parse({ name: "", type: "t", data: {} })).toThrow();
  });

  it("should_accept_valid_TransferCredential", () => {
    expect(TransferCredentialSchema.parse({ credential_id: "c1", destinationProjectId: "p1" })).toBeDefined();
  });
});

describe("Tag schemas", () => {
  it("should_accept_valid_CreateTag", () => {
    expect(CreateTagSchema.parse({ name: "production" })).toBeDefined();
  });

  it("should_reject_CreateTag_empty_name", () => {
    expect(() => CreateTagSchema.parse({ name: "" })).toThrow();
  });

  it("should_accept_valid_UpdateTag", () => {
    expect(UpdateTagSchema.parse({ tag_id: "t1", name: "staging" })).toBeDefined();
  });
});

describe("Variable schemas", () => {
  it("should_accept_valid_CreateVariable", () => {
    expect(CreateVariableSchema.parse({ key: "API_URL", value: "https://example.com" })).toBeDefined();
  });

  it("should_reject_CreateVariable_empty_key", () => {
    expect(() => CreateVariableSchema.parse({ key: "", value: "v" })).toThrow();
  });

  it("should_accept_valid_UpdateVariable", () => {
    expect(UpdateVariableSchema.parse({ variable_id: "v1", value: "new" })).toBeDefined();
  });
});

describe("User schemas", () => {
  it("should_accept_valid_CreateUsers", () => {
    expect(CreateUsersSchema.parse({ users: [{ email: "a@b.com", role: "global:member" }] })).toBeDefined();
  });

  it("should_reject_CreateUsers_invalid_email", () => {
    expect(() => CreateUsersSchema.parse({ users: [{ email: "bad", role: "global:member" }] })).toThrow();
  });

  it("should_reject_CreateUsers_invalid_role", () => {
    expect(() => CreateUsersSchema.parse({ users: [{ email: "a@b.com", role: "superadmin" }] })).toThrow();
  });

  it("should_accept_valid_ChangeUserRole", () => {
    expect(ChangeUserRoleSchema.parse({ user_id: "u1", newRoleName: "global:admin" })).toBeDefined();
  });
});

describe("Audit schema", () => {
  it("should_accept_valid_GenerateAudit", () => {
    expect(GenerateAuditSchema.parse({ categories: ["credentials", "nodes"] })).toBeDefined();
    expect(GenerateAuditSchema.parse({})).toBeDefined();
  });

  it("should_reject_invalid_category", () => {
    expect(() => GenerateAuditSchema.parse({ categories: ["invalid"] })).toThrow();
  });
});

describe("RawApiCall schema", () => {
  it("should_accept_valid_RawApiCall", () => {
    expect(RawApiCallSchema.parse({ method: "GET", path: "/workflows" })).toBeDefined();
  });

  it("should_reject_invalid_method", () => {
    expect(() => RawApiCallSchema.parse({ method: "OPTIONS", path: "/" })).toThrow();
  });
});
