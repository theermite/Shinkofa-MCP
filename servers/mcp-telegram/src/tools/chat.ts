/**
 * Chat management tools — info, settings, members, moderation, invite links, forum topics.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TelegramClient } from "../lib/client.js";
import {
  GetChatSchema,
  SetChatTitleSchema,
  SetChatDescriptionSchema,
  SetChatPermissionsSchema,
  BanChatMemberSchema,
  UnbanChatMemberSchema,
  RestrictChatMemberSchema,
  PromoteChatMemberSchema,
  CreateInviteLinkSchema,
  GetChatMemberSchema,
  CreateForumTopicSchema,
  EditForumTopicSchema,
  ForumTopicActionSchema,
} from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerChatTools(server: McpServer, client: TelegramClient): void {
  // ── Chat Info ──

  server.tool(
    "get_chat",
    "Get full information about a chat (group, channel, or private)",
    GetChatSchema.shape,
    async (params) => {
      const result = await client.callApi("getChat", params);
      return toolResult(result);
    }
  );

  server.tool(
    "get_chat_member",
    "Get information about a specific member in a chat",
    GetChatMemberSchema.shape,
    async (params) => {
      const result = await client.callApi("getChatMember", params);
      return toolResult(result);
    }
  );

  server.tool(
    "get_chat_member_count",
    "Get the number of members in a chat",
    GetChatSchema.shape,
    async (params) => {
      const result = await client.callApi("getChatMembersCount", params);
      return toolResult(result);
    }
  );

  server.tool(
    "get_chat_administrators",
    "Get a list of administrators in a chat",
    GetChatSchema.shape,
    async (params) => {
      const result = await client.callApi("getChatAdministrators", params);
      return toolResult(result);
    }
  );

  // ── Chat Settings ──

  server.tool(
    "set_chat_title",
    "Change the title of a group or channel",
    SetChatTitleSchema.shape,
    async (params) => {
      const result = await client.callApi("setChatTitle", params);
      return toolResult(result);
    }
  );

  server.tool(
    "set_chat_description",
    "Change the description of a group or channel",
    SetChatDescriptionSchema.shape,
    async (params) => {
      const result = await client.callApi("setChatDescription", params);
      return toolResult(result);
    }
  );

  server.tool(
    "set_chat_permissions",
    "Set default permissions for all members in a group",
    SetChatPermissionsSchema.shape,
    async (params) => {
      const result = await client.callApi("setChatPermissions", params);
      return toolResult(result);
    }
  );

  // ── Moderation ──

  server.tool(
    "ban_chat_member",
    "Ban a user from a group or channel",
    BanChatMemberSchema.shape,
    async (params) => {
      const result = await client.callApi("banChatMember", params);
      return toolResult(result);
    }
  );

  server.tool(
    "unban_chat_member",
    "Unban a user from a group or channel",
    UnbanChatMemberSchema.shape,
    async (params) => {
      const result = await client.callApi("unbanChatMember", params);
      return toolResult(result);
    }
  );

  server.tool(
    "restrict_chat_member",
    "Restrict a user's permissions in a group",
    RestrictChatMemberSchema.shape,
    async (params) => {
      const result = await client.callApi("restrictChatMember", params);
      return toolResult(result);
    }
  );

  server.tool(
    "promote_chat_member",
    "Promote or demote an administrator in a group",
    PromoteChatMemberSchema.shape,
    async (params) => {
      const result = await client.callApi("promoteChatMember", params);
      return toolResult(result);
    }
  );

  // ── Invite Links ──

  server.tool(
    "create_invite_link",
    "Create an additional invite link for a chat",
    CreateInviteLinkSchema.shape,
    async (params) => {
      const result = await client.callApi("createChatInviteLink", params);
      return toolResult(result);
    }
  );

  server.tool(
    "export_invite_link",
    "Generate a new primary invite link for a chat",
    GetChatSchema.shape,
    async (params) => {
      const result = await client.callApi("exportChatInviteLink", params);
      return toolResult(result);
    }
  );

  // ── Forum Topics ──

  server.tool(
    "create_forum_topic",
    "Create a new forum topic in a supergroup",
    CreateForumTopicSchema.shape,
    async (params) => {
      const result = await client.callApi("createForumTopic", params);
      return toolResult(result);
    }
  );

  server.tool(
    "edit_forum_topic",
    "Edit the name or icon of a forum topic",
    EditForumTopicSchema.shape,
    async (params) => {
      const result = await client.callApi("editForumTopic", params);
      return toolResult(result);
    }
  );

  server.tool(
    "close_forum_topic",
    "Close a forum topic",
    ForumTopicActionSchema.shape,
    async (params) => {
      const result = await client.callApi("closeForumTopic", params);
      return toolResult(result);
    }
  );

  server.tool(
    "reopen_forum_topic",
    "Reopen a closed forum topic",
    ForumTopicActionSchema.shape,
    async (params) => {
      const result = await client.callApi("reopenForumTopic", params);
      return toolResult(result);
    }
  );

  server.tool(
    "delete_forum_topic",
    "Delete a forum topic and all its messages",
    ForumTopicActionSchema.shape,
    async (params) => {
      const result = await client.callApi("deleteForumTopic", params);
      return toolResult(result);
    }
  );
}
