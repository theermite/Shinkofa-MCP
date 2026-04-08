/**
 * Scheduled Events tools — create, get, modify, delete, list users.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient } from "../lib/client.js";
import {
  ListEventsSchema, CreateEventSchema, GetEventSchema,
  ModifyEventSchema, DeleteEventSchema, GetEventUsersSchema,
} from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerEventTools(server: McpServer, client: DiscordClient): void {
  server.tool("list_scheduled_events", "List all scheduled events in a guild", ListEventsSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/scheduled-events`, undefined, { with_user_count: p.with_user_count }));
  });

  server.tool("create_scheduled_event", "Create a scheduled event (voice, stage, or external)", CreateEventSchema.shape, async (p) => {
    const { guild_id, reason, ...body } = p;
    return toolResult(await client.callApi("POST", `/guilds/${guild_id}/scheduled-events`, body, undefined, reason));
  });

  server.tool("get_scheduled_event", "Get a scheduled event by ID", GetEventSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/scheduled-events/${p.event_id}`, undefined, { with_user_count: p.with_user_count }));
  });

  server.tool("modify_scheduled_event", "Modify a scheduled event", ModifyEventSchema.shape, async (p) => {
    const { guild_id, event_id, reason, ...body } = p;
    return toolResult(await client.callApi("PATCH", `/guilds/${guild_id}/scheduled-events/${event_id}`, body, undefined, reason));
  });

  server.tool("delete_scheduled_event", "Delete a scheduled event", DeleteEventSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/guilds/${p.guild_id}/scheduled-events/${p.event_id}`));
  });

  server.tool("get_event_users", "Get users interested in a scheduled event", GetEventUsersSchema.shape, async (p) => {
    const { guild_id, event_id, ...query } = p;
    return toolResult(await client.callApi("GET", `/guilds/${guild_id}/scheduled-events/${event_id}/users`, undefined, query as Record<string, string | number | boolean | undefined>));
  });
}
