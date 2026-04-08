/**
 * Chat tools — chatters, emotes, settings, messages, announcements, shoutouts, VIPs, colors.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TwitchClient } from "../lib/client.js";
import {
  GetChattersSchema, GetEmotesSchema, GetChatSettingsSchema, UpdateChatSettingsSchema,
  SendChatAnnouncementSchema, SendShoutoutSchema, SendChatMessageSchema,
  DeleteChatMessageSchema, GetChatColorSchema, UpdateChatColorSchema,
  GetVIPsSchema, AddRemoveVIPSchema,
} from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerChatTools(server: McpServer, client: TwitchClient): void {
  server.tool("get_chatters", "Get list of users currently in chat", GetChattersSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/chat/chatters", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });

  server.tool("get_channel_emotes", "Get custom emotes for a channel", GetEmotesSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/chat/emotes", undefined, { broadcaster_id: p.broadcaster_id }));
  });

  server.tool("get_global_emotes", "Get global Twitch emotes", {}, async () => {
    return toolResult(await client.callApi("GET", "/chat/emotes/global"));
  });

  server.tool("get_channel_badges", "Get channel chat badges", GetEmotesSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/chat/badges", undefined, { broadcaster_id: p.broadcaster_id }));
  });

  server.tool("get_global_badges", "Get global Twitch chat badges", {}, async () => {
    return toolResult(await client.callApi("GET", "/chat/badges/global"));
  });

  server.tool("get_chat_settings", "Get chat settings (slow mode, follower-only, sub-only, etc.)", GetChatSettingsSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/chat/settings", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });

  server.tool("update_chat_settings", "Update chat settings (slow mode, follower-only, emote-only, etc.)", UpdateChatSettingsSchema.shape, async (p) => {
    const { broadcaster_id, moderator_id, ...body } = p;
    return toolResult(await client.callApi("PATCH", "/chat/settings", body, { broadcaster_id, moderator_id }));
  });

  server.tool("send_chat_announcement", "Send an announcement to chat", SendChatAnnouncementSchema.shape, async (p) => {
    const { broadcaster_id, moderator_id, ...body } = p;
    return toolResult(await client.callApi("POST", "/chat/announcements", body, { broadcaster_id, moderator_id }));
  });

  server.tool("send_shoutout", "Send a Shoutout to another broadcaster in chat", SendShoutoutSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/chat/shoutouts", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });

  server.tool("send_chat_message", "Send a chat message via Helix API", SendChatMessageSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/chat/messages", p as Record<string, unknown>));
  });

  server.tool("delete_chat_message", "Delete a specific message or clear all chat", DeleteChatMessageSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", "/chat/messages", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });

  server.tool("get_chat_color", "Get user chat name color(s)", GetChatColorSchema.shape, async (p) => {
    const ids = Array.isArray(p.user_id) ? p.user_id : [p.user_id];
    return toolResult(await client.callApi("GET", "/chat/color", undefined, { user_id: ids }));
  });

  server.tool("update_chat_color", "Update user chat name color", UpdateChatColorSchema.shape, async (p) => {
    return toolResult(await client.callApi("PUT", "/chat/color", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });

  server.tool("get_vips", "Get VIPs for a channel", GetVIPsSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/channels/vips", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });

  server.tool("add_vip", "Add a VIP to a channel", AddRemoveVIPSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/channels/vips", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });

  server.tool("remove_vip", "Remove a VIP from a channel", AddRemoveVIPSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", "/channels/vips", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
}
