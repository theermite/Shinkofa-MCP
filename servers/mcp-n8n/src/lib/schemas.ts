/**
 * Zod schemas for n8n MCP tool inputs.
 */
import { z } from "zod";

// ── Common ──

export const WorkflowId = z.string().describe("Workflow ID");
export const ExecutionId = z.number().describe("Execution ID");
export const TagId = z.string().describe("Tag ID");
export const UserId = z.string().describe("User ID");
export const CredentialId = z.string().describe("Credential ID");
export const VariableId = z.string().describe("Variable ID");

// ── Workflows ──

export const ListWorkflowsSchema = z.object({
  active: z.boolean().optional().describe("Filter by active/inactive status"),
  tags: z.string().optional().describe("Comma-separated tag names to filter by"),
  name: z.string().optional().describe("Filter by workflow name (partial match)"),
  limit: z.number().min(1).max(250).optional().describe("Max workflows to return (default 100, max 250)"),
  cursor: z.string().optional().describe("Pagination cursor from previous response"),
  projectId: z.string().optional().describe("Filter by project ID"),
});

export const GetWorkflowSchema = z.object({
  workflow_id: WorkflowId,
});

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1).describe("Workflow name"),
  nodes: z.array(z.record(z.unknown())).describe("Array of workflow node objects"),
  connections: z.record(z.unknown()).describe("Node connection map"),
  settings: z.record(z.unknown()).optional().describe("Workflow settings (e.g. executionOrder)"),
  staticData: z.record(z.unknown()).optional().describe("Static data for the workflow"),
  tags: z.array(TagId).optional().describe("Tag IDs to assign"),
});

export const UpdateWorkflowSchema = z.object({
  workflow_id: WorkflowId,
  name: z.string().min(1).optional().describe("Workflow name"),
  nodes: z.array(z.record(z.unknown())).optional().describe("Array of workflow node objects"),
  connections: z.record(z.unknown()).optional().describe("Node connection map"),
  settings: z.record(z.unknown()).optional().describe("Workflow settings"),
  staticData: z.record(z.unknown()).optional().describe("Static data"),
  tags: z.array(TagId).optional().describe("Tag IDs (replaces existing)"),
  active: z.boolean().optional().describe("Activate or deactivate"),
});

export const DeleteWorkflowSchema = z.object({
  workflow_id: WorkflowId,
});

export const ActivateWorkflowSchema = z.object({
  workflow_id: WorkflowId,
});

export const DeactivateWorkflowSchema = z.object({
  workflow_id: WorkflowId,
});

export const RunWorkflowSchema = z.object({
  workflow_id: WorkflowId,
  data: z.record(z.unknown()).optional().describe("Data to pass as workflow input"),
});

export const GetWorkflowTagsSchema = z.object({
  workflow_id: WorkflowId,
});

export const SetWorkflowTagsSchema = z.object({
  workflow_id: WorkflowId,
  tags: z.array(z.object({ id: TagId })).describe("Array of tag objects with id"),
});

// ── Executions ──

export const ListExecutionsSchema = z.object({
  workflowId: WorkflowId.optional().describe("Filter by workflow ID"),
  status: z.enum(["error", "success", "waiting", "running", "canceled"]).optional().describe("Filter by execution status"),
  includeData: z.boolean().optional().describe("Include execution data in response"),
  limit: z.number().min(1).max(250).optional().describe("Max executions to return (default 20, max 250)"),
  cursor: z.string().optional().describe("Pagination cursor from previous response"),
});

export const GetExecutionSchema = z.object({
  execution_id: ExecutionId,
  includeData: z.boolean().optional().describe("Include full execution data"),
});

export const DeleteExecutionSchema = z.object({
  execution_id: ExecutionId,
});

export const RetryExecutionSchema = z.object({
  execution_id: ExecutionId,
  loadWorkflow: z.boolean().optional().describe("Whether to reload the workflow before retrying"),
});

export const StopExecutionSchema = z.object({
  execution_id: ExecutionId,
});

// ── Credentials ──

export const CreateCredentialSchema = z.object({
  name: z.string().min(1).describe("Credential name"),
  type: z.string().describe("Credential type (e.g. 'httpBasicAuth', 'oAuth2Api')"),
  data: z.record(z.unknown()).describe("Credential data (specific to type)"),
});

export const DeleteCredentialSchema = z.object({
  credential_id: CredentialId,
});

export const GetCredentialSchemaSchema = z.object({
  credential_type: z.string().describe("Credential type name (e.g. 'githubApi')"),
});

export const TransferCredentialSchema = z.object({
  credential_id: CredentialId,
  destinationProjectId: z.string().describe("Target project ID"),
});

// ── Tags ──

export const ListTagsSchema = z.object({
  limit: z.number().min(1).max(250).optional().describe("Max tags to return (default 100, max 250)"),
  cursor: z.string().optional().describe("Pagination cursor"),
});

export const GetTagSchema = z.object({
  tag_id: TagId,
});

export const CreateTagSchema = z.object({
  name: z.string().min(1).describe("Tag name"),
});

export const UpdateTagSchema = z.object({
  tag_id: TagId,
  name: z.string().min(1).describe("New tag name"),
});

export const DeleteTagSchema = z.object({
  tag_id: TagId,
});

// ── Variables ──

export const ListVariablesSchema = z.object({
  limit: z.number().min(1).max(250).optional().describe("Max variables to return"),
  cursor: z.string().optional().describe("Pagination cursor"),
});

export const CreateVariableSchema = z.object({
  key: z.string().min(1).describe("Variable key"),
  value: z.string().describe("Variable value"),
  type: z.enum(["string", "number", "boolean"]).optional().describe("Variable type (default: string)"),
});

export const UpdateVariableSchema = z.object({
  variable_id: VariableId,
  key: z.string().min(1).optional().describe("Variable key"),
  value: z.string().optional().describe("Variable value"),
  type: z.enum(["string", "number", "boolean"]).optional().describe("Variable type"),
});

export const DeleteVariableSchema = z.object({
  variable_id: VariableId,
});

// ── Users ──

export const ListUsersSchema = z.object({
  limit: z.number().min(1).max(250).optional().describe("Max users to return"),
  cursor: z.string().optional().describe("Pagination cursor"),
  includeRole: z.boolean().optional().describe("Include role data"),
  projectId: z.string().optional().describe("Filter by project ID"),
});

export const GetUserSchema = z.object({
  user_id: UserId.describe("User ID or email"),
  includeRole: z.boolean().optional().describe("Include role data"),
});

export const CreateUsersSchema = z.object({
  users: z.array(z.object({
    email: z.string().email().describe("User email"),
    role: z.enum(["global:admin", "global:member"]).describe("User role"),
  })).min(1).describe("Array of users to create"),
});

export const DeleteUserSchema = z.object({
  user_id: UserId,
});

export const ChangeUserRoleSchema = z.object({
  user_id: UserId,
  newRoleName: z.enum(["global:admin", "global:member"]).describe("New role to assign"),
});

// ── Audit ──

export const GenerateAuditSchema = z.object({
  categories: z.array(z.enum([
    "credentials", "database", "filesystem", "instance", "nodes",
  ])).optional().describe("Audit categories to include (default: all)"),
  daysAbandonedWorkflow: z.number().optional().describe("Days to consider a workflow abandoned"),
});

// ── Raw API Call ──

export const RawApiCallSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
  path: z.string().describe("API path relative to /api/v1 (e.g. '/workflows/123/tags')"),
  body: z.record(z.unknown()).optional().describe("JSON request body"),
  query: z.record(z.string()).optional().describe("Query string parameters"),
});
