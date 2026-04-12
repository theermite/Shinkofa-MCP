import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { N8nClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";
import { z } from "zod";

export function registerWorkflowTools(server: McpServer, client: N8nClient): void {
  server.tool("list_workflows", "List all n8n workflows", { cursor: z.string().optional(), limit: z.number().optional(), tags: z.string().optional().describe("Filter by tag name"), name: z.string().optional(), active: z.boolean().optional() }, async (p) => {
    return withErrorHandler(() => client.callApi("GET", "/workflows", undefined, p as Record<string, string | number | boolean | undefined>).then(toolResult));
  });
  server.tool("get_workflow", "Get a workflow by ID", { id: z.string() }, async (p) => {
    return withErrorHandler(() => client.callApi("GET", `/workflows/${p.id}`).then(toolResult));
  });
  server.tool("create_workflow", "Create a new workflow", { name: z.string(), nodes: z.array(z.record(z.unknown())).optional(), connections: z.record(z.unknown()).optional(), settings: z.record(z.unknown()).optional(), active: z.boolean().optional() }, async (p) => {
    return withErrorHandler(() => client.callApi("POST", "/workflows", p as Record<string, unknown>).then(toolResult));
  });
  server.tool("update_workflow", "Update a workflow", { id: z.string(), name: z.string().optional(), nodes: z.array(z.record(z.unknown())).optional(), connections: z.record(z.unknown()).optional(), settings: z.record(z.unknown()).optional(), active: z.boolean().optional() }, async (p) => {
    const { id, ...body } = p;
    return withErrorHandler(() => client.callApi("PATCH", `/workflows/${id}`, body).then(toolResult));
  });
  server.tool("delete_workflow", "Delete a workflow", { id: z.string() }, async (p) => {
    return withErrorHandler(() => client.callApi("DELETE", `/workflows/${p.id}`).then(toolResult));
  });
  server.tool("activate_workflow", "Activate a workflow", { id: z.string() }, async (p) => {
    return withErrorHandler(() => client.callApi("POST", `/workflows/${p.id}/activate`).then(toolResult));
  });
  server.tool("deactivate_workflow", "Deactivate a workflow", { id: z.string() }, async (p) => {
    return withErrorHandler(() => client.callApi("POST", `/workflows/${p.id}/deactivate`).then(toolResult));
  });
  server.tool("run_workflow", "Execute a workflow manually", { id: z.string() }, async (p) => {
    return withErrorHandler(() => client.callApi("POST", `/workflows/${p.id}/run`).then(toolResult));
  });
  server.tool("get_workflow_tags", "Get tags for a workflow", { id: z.string() }, async (p) => {
    return withErrorHandler(() => client.callApi("GET", `/workflows/${p.id}/tags`).then(toolResult));
  });
  server.tool("set_workflow_tags", "Set tags for a workflow", { id: z.string(), tags: z.array(z.object({ id: z.string() })) }, async (p) => {
    return withErrorHandler(() => client.callApi("PUT", `/workflows/${p.id}/tags`, p.tags as unknown as Record<string, unknown>).then(toolResult));
  });
}
