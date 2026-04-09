/**
 * Content tools — clips, schedule, videos, search, games, users, subscriptions, whispers, eventsub.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TwitchClient } from "../lib/client.js";
import {
  CreateClipSchema, GetClipsSchema,
  GetScheduleSchema, CreateScheduleSegmentSchema, UpdateScheduleSegmentSchema, DeleteScheduleSegmentSchema,
  GetVideosSchema, DeleteVideosSchema,
  SearchCategoriesSchema, SearchChannelsSchema,
  GetGamesSchema, GetTopGamesSchema,
  GetUsersSchema, UpdateUserSchema, GetUserBlocksSchema, BlockUnblockUserSchema,
  GetSubscriptionsSchema, CheckUserSubSchema,
  SendWhisperSchema,
  CreateEventSubSchema, GetEventSubSchema, DeleteEventSubSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerContentTools(server: McpServer, client: TwitchClient): void {
  // Clips
  server.tool("create_clip", "Create a clip of a live stream", CreateClipSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("POST", "/clips", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  server.tool("get_clips", "Get clips by broadcaster, game, or ID", GetClipsSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/clips", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  // Schedule
  server.tool("get_schedule", "Get a channel's stream schedule", GetScheduleSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/schedule", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  server.tool("create_schedule_segment", "Create a scheduled stream segment", CreateScheduleSegmentSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { broadcaster_id, ...body } = p;
      return toolResult(await client.callApi("POST", "/schedule/segment", body, { broadcaster_id }));
    })
  );

  server.tool("update_schedule_segment", "Update a scheduled stream segment", UpdateScheduleSegmentSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { broadcaster_id, id, ...body } = p;
      return toolResult(await client.callApi("PATCH", "/schedule/segment", body, { broadcaster_id, id }));
    })
  );

  server.tool("delete_schedule_segment", "Delete a scheduled stream segment", DeleteScheduleSegmentSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("DELETE", "/schedule/segment", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  // Videos
  server.tool("get_videos", "Get VODs/videos by ID, user, or game", GetVideosSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/videos", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  server.tool("delete_videos", "Delete videos (max 5 at once)", DeleteVideosSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const ids = Array.isArray(p.id) ? p.id : [p.id];
      return toolResult(await client.callApi("DELETE", "/videos", undefined, { id: ids }));
    })
  );

  // Search
  server.tool("search_categories", "Search for games/categories by name", SearchCategoriesSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/search/categories", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  server.tool("search_channels", "Search for channels (optionally live only)", SearchChannelsSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/search/channels", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  // Games
  server.tool("get_games", "Get game/category info by ID, name, or IGDB ID", GetGamesSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/games", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  server.tool("get_top_games", "Get top games/categories on Twitch", GetTopGamesSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/games/top", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  // Users
  server.tool("get_users", "Get user info by ID or login name", GetUsersSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/users", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  server.tool("update_user", "Update authenticated user's description", UpdateUserSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("PUT", "/users", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  server.tool("get_user_blocks", "Get blocked users list", GetUserBlocksSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/users/blocks", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  server.tool("block_user", "Block a user", BlockUnblockUserSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("PUT", "/users/blocks", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  server.tool("unblock_user", "Unblock a user", BlockUnblockUserSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("DELETE", "/users/blocks", undefined, { target_user_id: p.target_user_id }))
    )
  );

  // Subscriptions
  server.tool("get_subscriptions", "Get subscribers for a channel", GetSubscriptionsSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/subscriptions", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  server.tool("check_user_subscription", "Check if a user is subscribed to a channel", CheckUserSubSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/subscriptions/user", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  // Whispers
  server.tool("send_whisper", "Send a whisper (DM) to a user", SendWhisperSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { from_user_id, to_user_id, message } = p;
      return toolResult(await client.callApi("POST", "/whispers", { message }, { from_user_id, to_user_id }));
    })
  );

  // EventSub
  server.tool("create_eventsub_subscription", "Create an EventSub subscription", CreateEventSubSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("POST", "/eventsub/subscriptions", p as Record<string, unknown>))
    )
  );

  server.tool("get_eventsub_subscriptions", "Get EventSub subscriptions", GetEventSubSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/eventsub/subscriptions", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  server.tool("delete_eventsub_subscription", "Delete an EventSub subscription", DeleteEventSubSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("DELETE", "/eventsub/subscriptions", undefined, { id: p.id }))
    )
  );
}
