import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YouTubeClient } from "../lib/client.js";
import { SearchListSchema, CaptionsListSchema, CaptionsDeleteSchema, SubscriptionsListSchema, SubscriptionsInsertSchema, SubscriptionsDeleteSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerSearchTools(server: McpServer, client: YouTubeClient): void {
  server.tool("search_youtube", "Search YouTube (videos, channels, playlists)", SearchListSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/search", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
  server.tool("list_captions", "List caption tracks for a video", CaptionsListSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/captions", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
  server.tool("delete_caption", "Delete a caption track", CaptionsDeleteSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", "/captions", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
  server.tool("list_subscriptions", "List subscriptions", SubscriptionsListSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/subscriptions", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
  server.tool("subscribe", "Subscribe to a channel", SubscriptionsInsertSchema.shape, async (p) => {
    const { part, channelId } = p;
    return toolResult(await client.callApi("POST", "/subscriptions", { snippet: { resourceId: { kind: "youtube#channel", channelId } } }, { part: part ?? "snippet" }));
  });
  server.tool("unsubscribe", "Unsubscribe from a channel", SubscriptionsDeleteSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", "/subscriptions", undefined, { id: p.id }));
  });
}
