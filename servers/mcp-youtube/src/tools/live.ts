import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { YouTubeClient } from "../lib/client.js";
import {
  LiveBroadcastsBindSchema,
  LiveBroadcastsDeleteSchema,
  LiveBroadcastsInsertSchema,
  LiveBroadcastsListSchema,
  LiveBroadcastsTransitionSchema,
  LiveBroadcastsUpdateSchema,
  LiveChatBansDeleteSchema,
  LiveChatBansInsertSchema,
  LiveChatMessagesDeleteSchema,
  LiveChatMessagesInsertSchema,
  LiveChatMessagesListSchema,
  LiveChatModeratorsDeleteSchema,
  LiveChatModeratorsInsertSchema,
  LiveChatModeratorsListSchema,
  LiveStreamsDeleteSchema,
  LiveStreamsInsertSchema,
  LiveStreamsListSchema,
  LiveStreamsUpdateSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerLiveTools(server: McpServer, client: YouTubeClient): void {
  // Broadcasts
  server.tool("list_broadcasts", "List live broadcasts", LiveBroadcastsListSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          "/liveBroadcasts",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );
  server.tool("create_broadcast", "Create a live broadcast", LiveBroadcastsInsertSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { part, ...body } = p;
      return toolResult(
        await client.callApi("POST", "/liveBroadcasts", body, { part: part ?? "snippet,status,contentDetails" }),
      );
    }),
  );
  server.tool("update_broadcast", "Update a live broadcast", LiveBroadcastsUpdateSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { part, ...body } = p;
      return toolResult(
        await client.callApi("PUT", "/liveBroadcasts", body, { part: part ?? "snippet,status,contentDetails" }),
      );
    }),
  );
  server.tool("delete_broadcast", "Delete a live broadcast", LiveBroadcastsDeleteSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "DELETE",
          "/liveBroadcasts",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );
  server.tool("bind_broadcast", "Bind/unbind a broadcast to a stream", LiveBroadcastsBindSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "POST",
          "/liveBroadcasts/bind",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );
  server.tool(
    "transition_broadcast",
    "Transition broadcast status (testing/live/complete)",
    LiveBroadcastsTransitionSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "POST",
            "/liveBroadcasts/transition",
            undefined,
            p as Record<string, string | number | boolean | string[] | undefined>,
          ),
        ),
      ),
  );
  // Streams
  server.tool("list_live_streams", "List live streams", LiveStreamsListSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          "/liveStreams",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );
  server.tool("create_live_stream", "Create a live stream", LiveStreamsInsertSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { part, ...body } = p;
      return toolResult(await client.callApi("POST", "/liveStreams", body, { part: part ?? "snippet,cdn" }));
    }),
  );
  server.tool("update_live_stream", "Update a live stream", LiveStreamsUpdateSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { part, ...body } = p;
      return toolResult(await client.callApi("PUT", "/liveStreams", body, { part: part ?? "snippet,cdn" }));
    }),
  );
  server.tool("delete_live_stream", "Delete a live stream", LiveStreamsDeleteSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "DELETE",
          "/liveStreams",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );
  // Chat
  server.tool("list_live_chat_messages", "List messages in a live chat", LiveChatMessagesListSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          "/liveChat/messages",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );
  server.tool(
    "send_live_chat_message",
    "Send a message to a live chat",
    LiveChatMessagesInsertSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const { part, liveChatId, type, messageText } = p;
        return toolResult(
          await client.callApi(
            "POST",
            "/liveChat/messages",
            { snippet: { liveChatId, type: type ?? "textMessageEvent", textMessageDetails: { messageText } } },
            { part: part ?? "snippet" },
          ),
        );
      }),
  );
  server.tool("delete_live_chat_message", "Delete a live chat message", LiveChatMessagesDeleteSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("DELETE", "/liveChat/messages", undefined, { id: p.id })),
    ),
  );
  // Moderators
  server.tool("list_live_chat_moderators", "List live chat moderators", LiveChatModeratorsListSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          "/liveChat/moderators",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );
  server.tool("add_live_chat_moderator", "Add a live chat moderator", LiveChatModeratorsInsertSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { part, liveChatId, channelId } = p;
      return toolResult(
        await client.callApi(
          "POST",
          "/liveChat/moderators",
          { snippet: { liveChatId, moderatorDetails: { channelId } } },
          { part: part ?? "snippet" },
        ),
      );
    }),
  );
  server.tool(
    "remove_live_chat_moderator",
    "Remove a live chat moderator",
    LiveChatModeratorsDeleteSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(await client.callApi("DELETE", "/liveChat/moderators", undefined, { id: p.id })),
      ),
  );
  // Bans
  server.tool("ban_live_chat_user", "Ban a user from live chat", LiveChatBansInsertSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { part, liveChatId, channelId, type, banDurationSeconds } = p;
      return toolResult(
        await client.callApi(
          "POST",
          "/liveChat/bans",
          { snippet: { liveChatId, type, banDurationSeconds, bannedUserDetails: { channelId } } },
          { part: part ?? "snippet" },
        ),
      );
    }),
  );
  server.tool("unban_live_chat_user", "Remove a live chat ban", LiveChatBansDeleteSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("DELETE", "/liveChat/bans", undefined, { id: p.id }))),
  );
}
