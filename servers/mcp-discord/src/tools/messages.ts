/**
 * Message tools — send, get, edit, delete, bulk-delete, crosspost, reactions, pins.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient } from "../lib/client.js";
import {
  SendMessageSchema, GetMessagesSchema, GetMessageSchema,
  EditMessageSchema, DeleteMessageSchema, BulkDeleteMessagesSchema,
  CrosspostMessageSchema, AddReactionSchema, RemoveReactionSchema,
  GetReactionsSchema, DeleteAllReactionsSchema, PinMessageSchema,
  GetPinnedMessagesSchema,
} from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerMessageTools(server: McpServer, client: DiscordClient): void {
  server.tool("send_message", "Send a message to a channel (text, embeds, components)", SendMessageSchema.shape, async (p) => {
    const { channel_id, ...body } = p;
    return toolResult(await client.callApi("POST", `/channels/${channel_id}/messages`, body));
  });

  server.tool("get_messages", "Get messages from a channel", GetMessagesSchema.shape, async (p) => {
    const { channel_id, ...query } = p;
    return toolResult(await client.callApi("GET", `/channels/${channel_id}/messages`, undefined, query as Record<string, string | number | boolean | undefined>));
  });

  server.tool("get_message", "Get a specific message", GetMessageSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/channels/${p.channel_id}/messages/${p.message_id}`));
  });

  server.tool("edit_message", "Edit a message", EditMessageSchema.shape, async (p) => {
    const { channel_id, message_id, ...body } = p;
    return toolResult(await client.callApi("PATCH", `/channels/${channel_id}/messages/${message_id}`, body));
  });

  server.tool("delete_message", "Delete a message", DeleteMessageSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/channels/${p.channel_id}/messages/${p.message_id}`, undefined, undefined, p.reason));
  });

  server.tool("bulk_delete_messages", "Delete 2-100 messages at once (max 14 days old)", BulkDeleteMessagesSchema.shape, async (p) => {
    const { channel_id, ...body } = p;
    return toolResult(await client.callApi("POST", `/channels/${channel_id}/messages/bulk-delete`, body));
  });

  server.tool("crosspost_message", "Crosspost a message in an announcement channel to following channels", CrosspostMessageSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", `/channels/${p.channel_id}/messages/${p.message_id}/crosspost`));
  });

  server.tool("add_reaction", "Add a reaction to a message", AddReactionSchema.shape, async (p) => {
    return toolResult(await client.callApi("PUT", `/channels/${p.channel_id}/messages/${p.message_id}/reactions/${encodeURIComponent(p.emoji)}/@me`));
  });

  server.tool("remove_reaction", "Remove a reaction (own or another user's)", RemoveReactionSchema.shape, async (p) => {
    const target = p.user_id ?? "@me";
    return toolResult(await client.callApi("DELETE", `/channels/${p.channel_id}/messages/${p.message_id}/reactions/${encodeURIComponent(p.emoji)}/${target}`));
  });

  server.tool("get_reactions", "Get users who reacted with a specific emoji", GetReactionsSchema.shape, async (p) => {
    const { channel_id, message_id, emoji, ...query } = p;
    return toolResult(await client.callApi("GET", `/channels/${channel_id}/messages/${message_id}/reactions/${encodeURIComponent(emoji)}`, undefined, query as Record<string, string | number | boolean | undefined>));
  });

  server.tool("delete_all_reactions", "Delete all reactions on a message (or all of a specific emoji)", DeleteAllReactionsSchema.shape, async (p) => {
    const path = p.emoji
      ? `/channels/${p.channel_id}/messages/${p.message_id}/reactions/${encodeURIComponent(p.emoji)}`
      : `/channels/${p.channel_id}/messages/${p.message_id}/reactions`;
    return toolResult(await client.callApi("DELETE", path));
  });

  server.tool("pin_message", "Pin a message in a channel (max 50 pins)", PinMessageSchema.shape, async (p) => {
    return toolResult(await client.callApi("PUT", `/channels/${p.channel_id}/pins/${p.message_id}`, undefined, undefined, p.reason));
  });

  server.tool("unpin_message", "Unpin a message", PinMessageSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/channels/${p.channel_id}/pins/${p.message_id}`, undefined, undefined, p.reason));
  });

  server.tool("get_pinned_messages", "Get all pinned messages in a channel", GetPinnedMessagesSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/channels/${p.channel_id}/pins`));
  });
}
