import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TelegramClient } from "../lib/client.js";
import {
  SendMessageSchema, EditMessageTextSchema, DeleteMessageSchema,
  DeleteMessagesSchema, ForwardMessageSchema, CopyMessageSchema,
  PinMessageSchema, UnpinMessageSchema, SetMessageReactionSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerMessageTools(server: McpServer, client: TelegramClient): void {
  server.tool("send_message", "Send a text message to a chat, group, or channel", SendMessageSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("sendMessage", p)))
  );

  server.tool("edit_message_text", "Edit the text of an existing message", EditMessageTextSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("editMessageText", p)))
  );

  server.tool("delete_message", "Delete a single message", DeleteMessageSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("deleteMessage", p)))
  );

  server.tool("delete_messages", "Delete multiple messages at once (max 100)", DeleteMessagesSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("deleteMessages", p)))
  );

  server.tool("forward_message", "Forward a message from one chat to another", ForwardMessageSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("forwardMessage", p)))
  );

  server.tool("copy_message", "Copy a message without linking to the original", CopyMessageSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("copyMessage", p)))
  );

  server.tool("pin_message", "Pin a message in a chat", PinMessageSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("pinChatMessage", p)))
  );

  server.tool("unpin_message", "Unpin a message (or the most recent pinned message)", UnpinMessageSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("unpinChatMessage", p)))
  );

  server.tool("set_reaction", "Set reactions on a message", SetMessageReactionSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("setMessageReaction", p)))
  );
}
