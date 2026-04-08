import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YouTubeClient } from "../lib/client.js";
import { ChannelsListSchema, ChannelsUpdateSchema, PlaylistsListSchema, PlaylistsInsertSchema, PlaylistsUpdateSchema, PlaylistsDeleteSchema, PlaylistItemsListSchema, PlaylistItemsInsertSchema, PlaylistItemsUpdateSchema, PlaylistItemsDeleteSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerChannelTools(server: McpServer, client: YouTubeClient): void {
  server.tool("list_channels", "Get YouTube channel info", ChannelsListSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/channels", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
  server.tool("update_channel", "Update channel metadata", ChannelsUpdateSchema.shape, async (p) => {
    const { part, ...body } = p;
    return toolResult(await client.callApi("PUT", "/channels", body, { part: part ?? "snippet,brandingSettings" }));
  });
  // Playlists
  server.tool("list_playlists", "List playlists", PlaylistsListSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/playlists", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
  server.tool("create_playlist", "Create a playlist", PlaylistsInsertSchema.shape, async (p) => {
    const { part, ...body } = p;
    return toolResult(await client.callApi("POST", "/playlists", body, { part: part ?? "snippet,status" }));
  });
  server.tool("update_playlist", "Update a playlist", PlaylistsUpdateSchema.shape, async (p) => {
    const { part, ...body } = p;
    return toolResult(await client.callApi("PUT", "/playlists", body, { part: part ?? "snippet,status" }));
  });
  server.tool("delete_playlist", "Delete a playlist", PlaylistsDeleteSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", "/playlists", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
  // PlaylistItems
  server.tool("list_playlist_items", "List items in a playlist", PlaylistItemsListSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/playlistItems", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
  server.tool("add_to_playlist", "Add a video to a playlist", PlaylistItemsInsertSchema.shape, async (p) => {
    const { part, ...body } = p;
    return toolResult(await client.callApi("POST", "/playlistItems", body, { part: part ?? "snippet" }));
  });
  server.tool("update_playlist_item", "Update a playlist item position", PlaylistItemsUpdateSchema.shape, async (p) => {
    const { part, ...body } = p;
    return toolResult(await client.callApi("PUT", "/playlistItems", body, { part: part ?? "snippet" }));
  });
  server.tool("remove_from_playlist", "Remove an item from a playlist", PlaylistItemsDeleteSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", "/playlistItems", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
}
