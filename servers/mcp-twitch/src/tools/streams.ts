/**
 * Stream tools — live streams, followed, markers, stream key.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TwitchClient } from "../lib/client.js";
import { GetStreamsSchema, GetFollowedStreamsSchema, CreateStreamMarkerSchema, GetStreamMarkersSchema, GetStreamKeySchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerStreamTools(server: McpServer, client: TwitchClient): void {
  server.tool("get_streams", "Get live streams (filter by user, game, language)", GetStreamsSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/streams", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });

  server.tool("get_followed_streams", "Get live streams from channels a user follows", GetFollowedStreamsSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/streams/followed", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });

  server.tool("create_stream_marker", "Create a stream marker at current timestamp", CreateStreamMarkerSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/streams/markers", p as Record<string, unknown>));
  });

  server.tool("get_stream_markers", "Get stream markers for a VOD or channel", GetStreamMarkersSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/streams/markers", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });

  server.tool("get_stream_key", "Get the stream key for a broadcaster", GetStreamKeySchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/streams/key", undefined, { broadcaster_id: p.broadcaster_id }));
  });
}
