/**
 * Member tools — list, get, modify, kick, ban, unban, bulk-ban, roles.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient } from "../lib/client.js";
import {
  GetMemberSchema, ListMembersSchema, SearchMembersSchema,
  ModifyMemberSchema, KickMemberSchema,
  BanMemberSchema, UnbanMemberSchema, GetBansSchema, GetBanSchema, BulkBanSchema,
  GetRolesSchema, CreateRoleSchema, ModifyRoleSchema, DeleteRoleSchema,
  ModifyRolePositionsSchema, AssignRoleSchema, RemoveRoleSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerMemberTools(server: McpServer, client: DiscordClient): void {
  server.tool("get_member", "Get a guild member", GetMemberSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/members/${p.user_id}`)))
  );

  server.tool("list_members", "List guild members (paginated)", ListMembersSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, ...query } = p;
      return toolResult(await client.callApi("GET", `/guilds/${guild_id}/members`, undefined, query as Record<string, string | number | boolean | undefined>));
    })
  );

  server.tool("search_members", "Search guild members by username or nickname", SearchMembersSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, ...query } = p;
      return toolResult(await client.callApi("GET", `/guilds/${guild_id}/members/search`, undefined, query as Record<string, string | number | boolean | undefined>));
    })
  );

  server.tool("modify_member", "Modify a guild member (nickname, roles, mute, deaf, timeout)", ModifyMemberSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, user_id, reason, ...body } = p;
      return toolResult(await client.callApi("PATCH", `/guilds/${guild_id}/members/${user_id}`, body, undefined, reason));
    })
  );

  server.tool("kick_member", "Kick a member from the guild", KickMemberSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("DELETE", `/guilds/${p.guild_id}/members/${p.user_id}`, undefined, undefined, p.reason)))
  );

  // Bans
  server.tool("ban_member", "Ban a user from the guild", BanMemberSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, user_id, reason, ...body } = p;
      return toolResult(await client.callApi("PUT", `/guilds/${guild_id}/bans/${user_id}`, body, undefined, reason));
    })
  );

  server.tool("unban_member", "Unban a user", UnbanMemberSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("DELETE", `/guilds/${p.guild_id}/bans/${p.user_id}`, undefined, undefined, p.reason)))
  );

  server.tool("get_bans", "List banned users in a guild", GetBansSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, ...query } = p;
      return toolResult(await client.callApi("GET", `/guilds/${guild_id}/bans`, undefined, query as Record<string, string | number | boolean | undefined>));
    })
  );

  server.tool("get_ban", "Get ban info for a specific user", GetBanSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/bans/${p.user_id}`)))
  );

  server.tool("bulk_ban", "Ban up to 200 users at once", BulkBanSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, reason, ...body } = p;
      return toolResult(await client.callApi("POST", `/guilds/${guild_id}/bulk-ban`, body, undefined, reason));
    })
  );

  // Roles
  server.tool("get_roles", "List all roles in a guild", GetRolesSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/roles`)))
  );

  server.tool("create_role", "Create a new role", CreateRoleSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, reason, ...body } = p;
      return toolResult(await client.callApi("POST", `/guilds/${guild_id}/roles`, body, undefined, reason));
    })
  );

  server.tool("modify_role", "Modify a role", ModifyRoleSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, role_id, reason, ...body } = p;
      return toolResult(await client.callApi("PATCH", `/guilds/${guild_id}/roles/${role_id}`, body, undefined, reason));
    })
  );

  server.tool("delete_role", "Delete a role", DeleteRoleSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("DELETE", `/guilds/${p.guild_id}/roles/${p.role_id}`, undefined, undefined, p.reason)))
  );

  server.tool("modify_role_positions", "Reorder roles", ModifyRolePositionsSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("PATCH", `/guilds/${p.guild_id}/roles`, { roles: p.roles } as unknown as Record<string, unknown>)))
  );

  server.tool("assign_role", "Add a role to a guild member", AssignRoleSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("PUT", `/guilds/${p.guild_id}/members/${p.user_id}/roles/${p.role_id}`, undefined, undefined, p.reason)))
  );

  server.tool("remove_role", "Remove a role from a guild member", RemoveRoleSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("DELETE", `/guilds/${p.guild_id}/members/${p.user_id}/roles/${p.role_id}`, undefined, undefined, p.reason)))
  );
}
