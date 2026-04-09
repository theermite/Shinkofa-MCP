/**
 * Interaction tools — respond, followup, edit/delete responses.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient } from "../lib/client.js";
import {
  CreateInteractionResponseSchema, GetOriginalResponseSchema,
  EditOriginalResponseSchema, DeleteOriginalResponseSchema,
  CreateFollowupSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerInteractionTools(server: McpServer, client: DiscordClient): void {
  server.tool("create_interaction_response", "Respond to an interaction (slash command, button, select, modal)", CreateInteractionResponseSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("POST", `/interactions/${p.interaction_id}/${p.interaction_token}/callback`, { type: p.type, data: p.data })))
  );

  server.tool("get_original_response", "Get the original interaction response", GetOriginalResponseSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/webhooks/${p.application_id}/${p.interaction_token}/messages/@original`)))
  );

  server.tool("edit_original_response", "Edit the original interaction response", EditOriginalResponseSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { application_id, interaction_token, ...body } = p;
      return toolResult(await client.callApi("PATCH", `/webhooks/${application_id}/${interaction_token}/messages/@original`, body));
    })
  );

  server.tool("delete_original_response", "Delete the original interaction response", DeleteOriginalResponseSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("DELETE", `/webhooks/${p.application_id}/${p.interaction_token}/messages/@original`)))
  );

  server.tool("create_followup", "Send a followup message to an interaction", CreateFollowupSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { application_id, interaction_token, ...body } = p;
      return toolResult(await client.callApi("POST", `/webhooks/${application_id}/${interaction_token}`, body));
    })
  );
}
