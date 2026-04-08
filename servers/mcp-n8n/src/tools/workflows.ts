import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { N8nClient } from "../lib/client.js";
import { toolResult } from "../lib/utils.js";
import { z } from "zod";

export function registerWorkflowTools(server: McpServer, client: N8nClient): void {
  server.tool("list_workflows", "List all n8n workflows", { cursor: z.string().optional(), limit: z.number().optional(), tags: z.string().optional().describe("Filter by tag name"), name: z.string().optional(), active: z.boolean().optional() }, async (p) => {
    return toolResult(await client.callApi("GET", "/workflows", undefined, p as Record<string, string | number | boolean | undefined>));
  });
  server.tool("get_workflow", "Get a workflow by ID", { id: z.string() }, async (p) => {
    return toolResult(await client.callApi("GET", `/workflows/${p.id}`));
  });
  server.tool("create_workflow", "Create a new workflow", { name: z.string(), nodes: z.array(z.record(z.unknown())).optional(), connections: z.record(z.unknown()).optional(), settings: z.record(z.unknown()).optional(), active: z.boolean().optional() }, async (p) => {
    return toolResult(await client.callApi("POST", "/workflows", p as Record<string, unknown>));
  });
  server.tool("update_workflow", "Update a workflow", { id: z.string(), name: z.string().optional(), nodes: z.array(z.record(z.unknown())).optional(), connections: z.record(z.unknown()).optional(), settings: z.record(z.unknown()).optional(), active: z.boolean().optional() }, async (p) => {
    const { id, ...body } = p;
    return toolResult(await client.callApi("PATCH", `/workflows/${id}`, body));
  });
  server.tool("delete_workflow", "Delete a workflow", { id: z.string() }, async (p) => {
    return toolResult(await client.callApi("DELETE", `/workflows/${p.id}`));
  });
  server.tool("activate_workflow", "Activate a workflow", { id: z.string() }, async (p) => {
    return toolResult(await client.callApi("POST", `/workflows/${p.id}/activate`));
  });
  server.tool("deactivate_workflow", "Deactivate a workflow", { id: z.string() }, async (p) => {
    return toolResult(await client.callApi("POST", `/workflows/${p.id}/deactivate`));
  });
  server.tool("run_workflow", "Execute a workflow manually", { id: z.string() }, async (p) => {
    return toolResult(await client.callApi("POST", `/workflows/${p.id}/run`));
  });
  server.tool("get_workflow_tags", "Get tags for a workflow", { id: z.string() }, async (p) => {
    return toolResult(await client.callApi("GET", `/workflows/${p.id}/tags`));
  });
  server.tool("set_workflow_tags", "Set tags for a workflow", { id: z.string(), tags: z.array(z.object({ id: z.string() })) }, async (p) => {
    return toolResult(await client.callApi("PUT", `/workflows/${p.id}/tags`, p.tags as unknown as Record<string, unknown>));
  });
}
