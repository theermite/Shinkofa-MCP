/**
 * Channel tools — get, modify, delete, permissions, typing, invites, threads.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient } from "../lib/client.js";
import {
  GetChannelSchema, ModifyChannelSchema, DeleteChannelSchema,
  EditPermissionsSchema, DeletePermissionsSchema, TriggerTypingSchema,
  CreateInviteSchema, GetChannelInvitesSchema, FollowAnnouncementChannelSchema,
  CreateThreadFromMessageSchema, CreateThreadSchema, JoinLeaveThreadSchema,
  AddRemoveThreadMemberSchema, ListThreadMembersSchema, ListArchivedThreadsSchema,
} from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerChannelTools(server: McpServer, client: DiscordClient): void {
  server.tool("get_channel", "Get a channel by ID", GetChannelSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/channels/${p.channel_id}`));
  });

  server.tool("modify_channel", "Modify a channel's settings (name, topic, slowmode, etc.)", ModifyChannelSchema.shape, async (p) => {
    const { channel_id, reason, ...body } = p;
    return toolResult(await client.callApi("PATCH", `/channels/${channel_id}`, body, undefined, reason));
  });

  server.tool("delete_channel", "Delete a channel or close a DM", DeleteChannelSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/channels/${p.channel_id}`, undefined, undefined, p.reason));
  });

  server.tool("edit_channel_permissions", "Edit permission overwrites for a role or user in a channel", EditPermissionsSchema.shape, async (p) => {
    const { channel_id, overwrite_id, reason, ...body } = p;
    return toolResult(await client.callApi("PUT", `/channels/${channel_id}/permissions/${overwrite_id}`, body, undefined, reason));
  });

  server.tool("delete_channel_permissions", "Delete permission overwrites for a role or user", DeletePermissionsSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/channels/${p.channel_id}/permissions/${p.overwrite_id}`, undefined, undefined, p.reason));
  });

  server.tool("trigger_typing", "Show typing indicator in a channel", TriggerTypingSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", `/channels/${p.channel_id}/typing`));
  });

  server.tool("create_invite", "Create a channel invite", CreateInviteSchema.shape, async (p) => {
    const { channel_id, reason, ...body } = p;
    return toolResult(await client.callApi("POST", `/channels/${channel_id}/invites`, body, undefined, reason));
  });

  server.tool("get_channel_invites", "Get all invites for a channel", GetChannelInvitesSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/channels/${p.channel_id}/invites`));
  });

  server.tool("follow_announcement_channel", "Follow an announcement channel to receive crossposted messages", FollowAnnouncementChannelSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", `/channels/${p.channel_id}/followers`, { webhook_channel_id: p.webhook_channel_id }));
  });

  // Threads
  server.tool("create_thread_from_message", "Create a thread from an existing message", CreateThreadFromMessageSchema.shape, async (p) => {
    const { channel_id, message_id, reason, ...body } = p;
    return toolResult(await client.callApi("POST", `/channels/${channel_id}/messages/${message_id}/threads`, body, undefined, reason));
  });

  server.tool("create_thread", "Create a thread (or forum/media post)", CreateThreadSchema.shape, async (p) => {
    const { channel_id, reason, ...body } = p;
    return toolResult(await client.callApi("POST", `/channels/${channel_id}/threads`, body, undefined, reason));
  });

  server.tool("join_thread", "Join a thread", JoinLeaveThreadSchema.shape, async (p) => {
    return toolResult(await client.callApi("PUT", `/channels/${p.channel_id}/thread-members/@me`));
  });

  server.tool("leave_thread", "Leave a thread", JoinLeaveThreadSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/channels/${p.channel_id}/thread-members/@me`));
  });

  server.tool("add_thread_member", "Add a member to a thread", AddRemoveThreadMemberSchema.shape, async (p) => {
    return toolResult(await client.callApi("PUT", `/channels/${p.channel_id}/thread-members/${p.user_id}`));
  });

  server.tool("remove_thread_member", "Remove a member from a thread", AddRemoveThreadMemberSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/channels/${p.channel_id}/thread-members/${p.user_id}`));
  });

  server.tool("list_thread_members", "List members of a thread", ListThreadMembersSchema.shape, async (p) => {
    const { channel_id, ...query } = p;
    return toolResult(await client.callApi("GET", `/channels/${channel_id}/thread-members`, undefined, query as Record<string, string | number | boolean | undefined>));
  });

  server.tool("list_archived_threads", "List archived threads in a channel", ListArchivedThreadsSchema.shape, async (p) => {
    const { channel_id, type, ...query } = p;
    return toolResult(await client.callApi("GET", `/channels/${channel_id}/threads/archived/${type}`, undefined, query as Record<string, string | number | boolean | undefined>));
  });
}
