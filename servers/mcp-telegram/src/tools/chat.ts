import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TelegramClient } from "../lib/client.js";
import {
  BanChatMemberSchema,
  CreateForumTopicSchema,
  CreateInviteLinkSchema,
  EditForumTopicSchema,
  ForumTopicActionSchema,
  GetChatMemberSchema,
  GetChatSchema,
  PromoteChatMemberSchema,
  RestrictChatMemberSchema,
  SetChatDescriptionSchema,
  SetChatPermissionsSchema,
  SetChatTitleSchema,
  UnbanChatMemberSchema,
} from "../lib/schemas-bot.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerChatTools(server: McpServer, client: TelegramClient): void {
  server.tool(
    "get_chat",
    "Get full information about a chat (group, channel, or private)",
    GetChatSchema.shape,
    async (p) => withErrorHandler(async () => toolResult(await client.callApi("getChat", p))),
  );

  server.tool(
    "get_chat_member",
    "Get information about a specific member in a chat",
    GetChatMemberSchema.shape,
    async (p) => withErrorHandler(async () => toolResult(await client.callApi("getChatMember", p))),
  );

  server.tool("get_chat_member_count", "Get the number of members in a chat", GetChatSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("getChatMembersCount", p))),
  );

  server.tool("get_chat_administrators", "Get a list of administrators in a chat", GetChatSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("getChatAdministrators", p))),
  );

  server.tool("set_chat_title", "Change the title of a group or channel", SetChatTitleSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("setChatTitle", p))),
  );

  server.tool(
    "set_chat_description",
    "Change the description of a group or channel",
    SetChatDescriptionSchema.shape,
    async (p) => withErrorHandler(async () => toolResult(await client.callApi("setChatDescription", p))),
  );

  server.tool(
    "set_chat_permissions",
    "Set default permissions for all members in a group",
    SetChatPermissionsSchema.shape,
    async (p) => withErrorHandler(async () => toolResult(await client.callApi("setChatPermissions", p))),
  );

  server.tool("ban_chat_member", "Ban a user from a group or channel", BanChatMemberSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("banChatMember", p))),
  );

  server.tool("unban_chat_member", "Unban a user from a group or channel", UnbanChatMemberSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("unbanChatMember", p))),
  );

  server.tool(
    "restrict_chat_member",
    "Restrict a user's permissions in a group",
    RestrictChatMemberSchema.shape,
    async (p) => withErrorHandler(async () => toolResult(await client.callApi("restrictChatMember", p))),
  );

  server.tool(
    "promote_chat_member",
    "Promote or demote an administrator in a group",
    PromoteChatMemberSchema.shape,
    async (p) => withErrorHandler(async () => toolResult(await client.callApi("promoteChatMember", p))),
  );

  server.tool(
    "create_invite_link",
    "Create an additional invite link for a chat",
    CreateInviteLinkSchema.shape,
    async (p) => withErrorHandler(async () => toolResult(await client.callApi("createChatInviteLink", p))),
  );

  server.tool("export_invite_link", "Generate a new primary invite link for a chat", GetChatSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("exportChatInviteLink", p))),
  );

  server.tool(
    "create_forum_topic",
    "Create a new forum topic in a supergroup",
    CreateForumTopicSchema.shape,
    async (p) => withErrorHandler(async () => toolResult(await client.callApi("createForumTopic", p))),
  );

  server.tool("edit_forum_topic", "Edit the name or icon of a forum topic", EditForumTopicSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("editForumTopic", p))),
  );

  server.tool("close_forum_topic", "Close a forum topic", ForumTopicActionSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("closeForumTopic", p))),
  );

  server.tool("reopen_forum_topic", "Reopen a closed forum topic", ForumTopicActionSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("reopenForumTopic", p))),
  );

  server.tool(
    "delete_forum_topic",
    "Delete a forum topic and all its messages",
    ForumTopicActionSchema.shape,
    async (p) => withErrorHandler(async () => toolResult(await client.callApi("deleteForumTopic", p))),
  );
}
