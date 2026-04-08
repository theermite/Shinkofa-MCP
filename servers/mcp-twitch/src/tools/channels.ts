/**
 * Channel tools — info, modify, editors, followers.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TwitchClient } from "../lib/client.js";
import { GetChannelInfoSchema, ModifyChannelSchema, GetChannelEditorsSchema, GetChannelFollowersSchema, GetFollowedChannelsSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerChannelTools(server: McpServer, client: TwitchClient): void {
  server.tool("get_channel_info", "Get channel information (title, game, language, tags)", GetChannelInfoSchema.shape, async (p) => {
    const ids = Array.isArray(p.broadcaster_id) ? p.broadcaster_id : [p.broadcaster_id];
    return toolResult(await client.callApi("GET", "/channels", undefined, { broadcaster_id: ids }));
  });

  server.tool("modify_channel", "Modify channel info (title, game, language, tags, CCLs)", ModifyChannelSchema.shape, async (p) => {
    const { broadcaster_id, ...body } = p;
    return toolResult(await client.callApi("PATCH", "/channels", body, { broadcaster_id }));
  });

  server.tool("get_channel_editors", "Get list of channel editors", GetChannelEditorsSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/channels/editors", undefined, { broadcaster_id: p.broadcaster_id }));
  });

  server.tool("get_channel_followers", "Get users who follow a channel", GetChannelFollowersSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/channels/followers", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });

  server.tool("get_followed_channels", "Get channels a user follows", GetFollowedChannelsSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/channels/followed", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
}
