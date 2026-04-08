/**
 * Application Commands tools — slash commands CRUD (global + guild).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient } from "../lib/client.js";
import {
  ListCommandsSchema, CreateCommandSchema, GetCommandSchema,
  ModifyCommandSchema, DeleteCommandSchema, BulkOverwriteCommandsSchema,
} from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerCommandTools(server: McpServer, client: DiscordClient): void {
  server.tool("list_commands", "List application commands (global or guild-specific)", ListCommandsSchema.shape, async (p) => {
    const path = p.guild_id
      ? `/applications/${p.application_id}/guilds/${p.guild_id}/commands`
      : `/applications/${p.application_id}/commands`;
    const query: Record<string, string | number | boolean | undefined> = {};
    if (p.with_localizations !== undefined) query.with_localizations = p.with_localizations;
    return toolResult(await client.callApi("GET", path, undefined, query));
  });

  server.tool("create_command", "Create an application command (global or guild-specific)", CreateCommandSchema.shape, async (p) => {
    const { application_id, guild_id, ...body } = p;
    const path = guild_id
      ? `/applications/${application_id}/guilds/${guild_id}/commands`
      : `/applications/${application_id}/commands`;
    return toolResult(await client.callApi("POST", path, body));
  });

  server.tool("get_command", "Get a specific application command", GetCommandSchema.shape, async (p) => {
    const path = p.guild_id
      ? `/applications/${p.application_id}/guilds/${p.guild_id}/commands/${p.command_id}`
      : `/applications/${p.application_id}/commands/${p.command_id}`;
    return toolResult(await client.callApi("GET", path));
  });

  server.tool("modify_command", "Modify an application command", ModifyCommandSchema.shape, async (p) => {
    const { application_id, command_id, guild_id, ...body } = p;
    const path = guild_id
      ? `/applications/${application_id}/guilds/${guild_id}/commands/${command_id}`
      : `/applications/${application_id}/commands/${command_id}`;
    return toolResult(await client.callApi("PATCH", path, body));
  });

  server.tool("delete_command", "Delete an application command", DeleteCommandSchema.shape, async (p) => {
    const path = p.guild_id
      ? `/applications/${p.application_id}/guilds/${p.guild_id}/commands/${p.command_id}`
      : `/applications/${p.application_id}/commands/${p.command_id}`;
    return toolResult(await client.callApi("DELETE", path));
  });

  server.tool("bulk_overwrite_commands", "Overwrite all application commands at once", BulkOverwriteCommandsSchema.shape, async (p) => {
    const path = p.guild_id
      ? `/applications/${p.application_id}/guilds/${p.guild_id}/commands`
      : `/applications/${p.application_id}/commands`;
    return toolResult(await client.callApi("PUT", path, p.commands as unknown as Record<string, unknown>));
  });
}
