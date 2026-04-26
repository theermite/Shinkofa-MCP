/**
 * Channel tools — info, modify, editors, followers.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TwitchClient } from "../lib/client.js";
import {
  GetChannelEditorsSchema,
  GetChannelFollowersSchema,
  GetChannelInfoSchema,
  GetFollowedChannelsSchema,
  ModifyChannelSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerChannelTools(server: McpServer, client: TwitchClient): void {
  server.tool(
    "get_channel_info",
    "Get channel information (title, game, language, tags)",
    GetChannelInfoSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const ids = Array.isArray(p.broadcaster_id) ? p.broadcaster_id : [p.broadcaster_id];
        return toolResult(await client.callApi("GET", "/channels", undefined, { broadcaster_id: ids }));
      }),
  );

  server.tool(
    "modify_channel",
    "Modify channel info (title, game, language, tags, CCLs)",
    ModifyChannelSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const { broadcaster_id, ...body } = p;
        return toolResult(await client.callApi("PATCH", "/channels", body, { broadcaster_id }));
      }),
  );

  server.tool("get_channel_editors", "Get list of channel editors", GetChannelEditorsSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/channels/editors", undefined, { broadcaster_id: p.broadcaster_id })),
    ),
  );

  server.tool("get_channel_followers", "Get users who follow a channel", GetChannelFollowersSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          "/channels/followers",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );

  server.tool("get_followed_channels", "Get channels a user follows", GetFollowedChannelsSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          "/channels/followed",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );
}
