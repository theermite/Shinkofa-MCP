/**
 * Action tools — execute actions, send chat messages.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { StreamerbotClient } from "../lib/client.js";
import { DoActionSchema, SendMessageSchema } from "../lib/schemas.js";
import { toolError, toolResult, withErrorHandler } from "../lib/utils.js";

export function registerActionTools(server: McpServer, client: StreamerbotClient): void {
  server.tool("sb-do-action", "Execute a Streamer.bot action by name or ID", DoActionSchema.shape, async (params) => {
    return withErrorHandler(async () => {
      const payload: Record<string, unknown> = {};
      if (params.id) {
        payload.action = { id: params.id };
      } else if (params.name) {
        payload.action = { name: params.name };
      } else {
        return toolError("Provide either name or id");
      }
      if (params.args) payload.args = params.args;
      const res = await client.sendRequest("DoAction", payload);
      return toolResult(res);
    });
  });

  server.tool(
    "sb-send-message",
    "Send a chat message to Twitch or YouTube",
    SendMessageSchema.shape,
    async (params) => {
      return withErrorHandler(async () => {
        const res = await client.sendRequest("SendMessage", {
          message: params.message,
          platform: params.platform === "twitch" ? 0 : 1,
          bot: params.bot,
          internal: true,
        });
        return toolResult(res);
      });
    },
  );
}
