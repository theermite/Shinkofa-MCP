import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GmailClient } from "../lib/client.js";
import { ListLabelsSchema, GetLabelSchema, CreateLabelSchema, UpdateLabelSchema, DeleteLabelSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerLabelTools(server: McpServer, client: GmailClient): void {
  server.tool("list_labels", "List all Gmail labels", ListLabelsSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/users/${p.userId}/labels`));
  });

  server.tool("get_label", "Get a label by ID", GetLabelSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/users/${p.userId}/labels/${p.id}`));
  });

  server.tool("create_label", "Create a new label", CreateLabelSchema.shape, async (p) => {
    const { userId, ...body } = p;
    return toolResult(await client.callApi("POST", `/users/${userId}/labels`, body));
  });

  server.tool("update_label", "Update an existing label", UpdateLabelSchema.shape, async (p) => {
    const { userId, id, ...body } = p;
    return toolResult(await client.callApi("PUT", `/users/${userId}/labels/${id}`, { id, ...body } as Record<string, unknown>));
  });

  server.tool("delete_label", "Delete a label", DeleteLabelSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/users/${p.userId}/labels/${p.id}`));
  });
}
