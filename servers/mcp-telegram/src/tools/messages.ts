/**
 * Message tools — send, edit, delete, forward, copy, pin, reactions.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TelegramClient } from "../lib/client.js";
import {
  SendMessageSchema,
  EditMessageTextSchema,
  DeleteMessageSchema,
  DeleteMessagesSchema,
  ForwardMessageSchema,
  CopyMessageSchema,
  PinMessageSchema,
  UnpinMessageSchema,
  SetMessageReactionSchema,
} from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerMessageTools(server: McpServer, client: TelegramClient): void {
  server.tool(
    "send_message",
    "Send a text message to a chat, group, or channel",
    SendMessageSchema.shape,
    async (params) => {
      const result = await client.callApi("sendMessage", params);
      return toolResult(result);
    }
  );

  server.tool(
    "edit_message_text",
    "Edit the text of an existing message",
    EditMessageTextSchema.shape,
    async (params) => {
      const result = await client.callApi("editMessageText", params);
      return toolResult(result);
    }
  );

  server.tool(
    "delete_message",
    "Delete a single message",
    DeleteMessageSchema.shape,
    async (params) => {
      const result = await client.callApi("deleteMessage", params);
      return toolResult(result);
    }
  );

  server.tool(
    "delete_messages",
    "Delete multiple messages at once (max 100)",
    DeleteMessagesSchema.shape,
    async (params) => {
      const result = await client.callApi("deleteMessages", params);
      return toolResult(result);
    }
  );

  server.tool(
    "forward_message",
    "Forward a message from one chat to another",
    ForwardMessageSchema.shape,
    async (params) => {
      const result = await client.callApi("forwardMessage", params);
      return toolResult(result);
    }
  );

  server.tool(
    "copy_message",
    "Copy a message without linking to the original",
    CopyMessageSchema.shape,
    async (params) => {
      const result = await client.callApi("copyMessage", params);
      return toolResult(result);
    }
  );

  server.tool(
    "pin_message",
    "Pin a message in a chat",
    PinMessageSchema.shape,
    async (params) => {
      const result = await client.callApi("pinChatMessage", params);
      return toolResult(result);
    }
  );

  server.tool(
    "unpin_message",
    "Unpin a message (or the most recent pinned message)",
    UnpinMessageSchema.shape,
    async (params) => {
      const result = await client.callApi("unpinChatMessage", params);
      return toolResult(result);
    }
  );

  server.tool(
    "set_reaction",
    "Set reactions on a message",
    SetMessageReactionSchema.shape,
    async (params) => {
      const result = await client.callApi("setMessageReaction", params);
      return toolResult(result);
    }
  );
}
