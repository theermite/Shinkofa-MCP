import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { N8nClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerResourceTools(server: McpServer, client: N8nClient): void {
  // Executions
  server.tool(
    "list_executions",
    "List workflow executions",
    {
      cursor: z.string().optional(),
      limit: z.number().optional(),
      workflowId: z.string().optional(),
      status: z.enum(["error", "success", "waiting"]).optional(),
      includeData: z.boolean().optional(),
    },
    async (p) => {
      return withErrorHandler(() =>
        client
          .callApi("GET", "/executions", undefined, p as Record<string, string | number | boolean | undefined>)
          .then(toolResult),
      );
    },
  );
  server.tool("get_execution", "Get an execution by ID", { id: z.number() }, async (p) => {
    return withErrorHandler(() => client.callApi("GET", `/executions/${p.id}`).then(toolResult));
  });
  server.tool("delete_execution", "Delete an execution", { id: z.number() }, async (p) => {
    return withErrorHandler(() => client.callApi("DELETE", `/executions/${p.id}`).then(toolResult));
  });
  // Credentials
  server.tool(
    "create_credential",
    "Create a credential",
    { name: z.string(), type: z.string(), data: z.record(z.unknown()) },
    async (p) => {
      return withErrorHandler(() =>
        client.callApi("POST", "/credentials", p as Record<string, unknown>).then(toolResult),
      );
    },
  );
  server.tool("delete_credential", "Delete a credential", { id: z.string() }, async (p) => {
    return withErrorHandler(() => client.callApi("DELETE", `/credentials/${p.id}`).then(toolResult));
  });
  server.tool(
    "get_credential_schema",
    "Get schema for a credential type",
    { credentialTypeName: z.string() },
    async (p) => {
      return withErrorHandler(() =>
        client.callApi("GET", `/credentials/schema/${p.credentialTypeName}`).then(toolResult),
      );
    },
  );
  // Tags
  server.tool(
    "list_tags",
    "List all tags",
    { cursor: z.string().optional(), limit: z.number().optional() },
    async (p) => {
      return withErrorHandler(() =>
        client
          .callApi("GET", "/tags", undefined, p as Record<string, string | number | boolean | undefined>)
          .then(toolResult),
      );
    },
  );
  server.tool("create_tag", "Create a tag", { name: z.string() }, async (p) => {
    return withErrorHandler(() => client.callApi("POST", "/tags", p as Record<string, unknown>).then(toolResult));
  });
  server.tool("get_tag", "Get a tag by ID", { id: z.string() }, async (p) => {
    return withErrorHandler(() => client.callApi("GET", `/tags/${p.id}`).then(toolResult));
  });
  server.tool("update_tag", "Update a tag", { id: z.string(), name: z.string() }, async (p) => {
    return withErrorHandler(() => client.callApi("PATCH", `/tags/${p.id}`, { name: p.name }).then(toolResult));
  });
  server.tool("delete_tag", "Delete a tag", { id: z.string() }, async (p) => {
    return withErrorHandler(() => client.callApi("DELETE", `/tags/${p.id}`).then(toolResult));
  });
  // Variables
  server.tool(
    "list_variables",
    "List all variables",
    { cursor: z.string().optional(), limit: z.number().optional() },
    async (p) => {
      return withErrorHandler(() =>
        client
          .callApi("GET", "/variables", undefined, p as Record<string, string | number | boolean | undefined>)
          .then(toolResult),
      );
    },
  );
  server.tool("create_variable", "Create a variable", { key: z.string(), value: z.string() }, async (p) => {
    return withErrorHandler(() => client.callApi("POST", "/variables", p as Record<string, unknown>).then(toolResult));
  });
  server.tool("delete_variable", "Delete a variable", { id: z.string() }, async (p) => {
    return withErrorHandler(() => client.callApi("DELETE", `/variables/${p.id}`).then(toolResult));
  });
  // Users
  server.tool(
    "list_users",
    "List all users",
    { cursor: z.string().optional(), limit: z.number().optional(), includeRole: z.boolean().optional() },
    async (p) => {
      return withErrorHandler(() =>
        client
          .callApi("GET", "/users", undefined, p as Record<string, string | number | boolean | undefined>)
          .then(toolResult),
      );
    },
  );
  server.tool("get_me", "Get current API user profile", {}, async () => {
    return withErrorHandler(() => client.callApi("GET", "/me").then(toolResult));
  });
  // Audit
  server.tool("generate_audit", "Generate a security audit of the n8n instance", {}, async () => {
    return withErrorHandler(() => client.callApi("POST", "/audit").then(toolResult));
  });
  // Raw
  server.tool(
    "raw_api_call",
    "Call any n8n API endpoint directly. Use for: source-control, LDAP, user management, credential transfer.",
    {
      method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
      path: z.string(),
      body: z.record(z.unknown()).optional(),
      query: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
    },
    async (params) => {
      return withErrorHandler(() =>
        client
          .callApi(
            params.method,
            params.path,
            params.body ?? undefined,
            params.query as Record<string, string | number | boolean | undefined> | undefined,
          )
          .then(toolResult),
      );
    },
  );
}
