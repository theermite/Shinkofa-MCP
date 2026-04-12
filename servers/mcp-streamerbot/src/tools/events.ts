/**
 * Event tools — list events, subscribe to event streams.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { StreamerbotClient } from "../lib/client.js";
import { SubscribeSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerEventTools(server: McpServer, client: StreamerbotClient): void {
  server.tool("sb-get-events", "List all subscribable events in Streamer.bot", {}, async () => {
    return withErrorHandler(async () => {
      const res = await client.sendRequest("GetEvents");
      return toolResult(res);
    });
  });

  server.tool("sb-subscribe", "Subscribe to Streamer.bot events (e.g. Twitch ChatMessage, Follow, Sub)", SubscribeSchema.shape, async (params) => {
    return withErrorHandler(async () => {
      const res = await client.sendRequest("Subscribe", { events: params.events });
      return toolResult(res);
    });
  });
}
