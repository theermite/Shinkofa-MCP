/**
 * Guild tools — server management, channels, welcome screen, onboarding, widget, prune.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient } from "../lib/client.js";
import {
  GetGuildSchema, ModifyGuildSchema, GetGuildChannelsSchema,
  CreateGuildChannelSchema, ModifyChannelPositionsSchema, GetActiveThreadsSchema,
  GetWelcomeScreenSchema, ModifyWelcomeScreenSchema,
  GetOnboardingSchema, ModifyOnboardingSchema,
  GetWidgetSettingsSchema, ModifyWidgetSchema, GetVanityUrlSchema,
  GetPruneCountSchema, BeginPruneSchema, GetAuditLogSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerGuildTools(server: McpServer, client: DiscordClient): void {
  server.tool("get_guild", "Get a guild (server) by ID", GetGuildSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/guilds/${p.guild_id}`, undefined, { with_counts: p.with_counts })))
  );

  server.tool("modify_guild", "Modify guild settings (name, verification, notifications, etc.)", ModifyGuildSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, reason, ...body } = p;
      return toolResult(await client.callApi("PATCH", `/guilds/${guild_id}`, body, undefined, reason));
    })
  );

  server.tool("get_guild_channels", "List all channels in a guild", GetGuildChannelsSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/channels`)))
  );

  server.tool("create_guild_channel", "Create a new channel in a guild", CreateGuildChannelSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, reason, ...body } = p;
      return toolResult(await client.callApi("POST", `/guilds/${guild_id}/channels`, body, undefined, reason));
    })
  );

  server.tool("modify_channel_positions", "Reorder channels in a guild", ModifyChannelPositionsSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("PATCH", `/guilds/${p.guild_id}/channels`, { channels: p.channels } as unknown as Record<string, unknown>)))
  );

  server.tool("get_active_threads", "Get all active threads in a guild", GetActiveThreadsSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/threads/active`)))
  );

  // Welcome Screen
  server.tool("get_welcome_screen", "Get the guild welcome screen", GetWelcomeScreenSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/welcome-screen`)))
  );

  server.tool("modify_welcome_screen", "Modify the guild welcome screen", ModifyWelcomeScreenSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, reason, ...body } = p;
      return toolResult(await client.callApi("PATCH", `/guilds/${guild_id}/welcome-screen`, body, undefined, reason));
    })
  );

  // Onboarding
  server.tool("get_onboarding", "Get guild onboarding configuration", GetOnboardingSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/onboarding`)))
  );

  server.tool("modify_onboarding", "Modify guild onboarding (prompts, default channels)", ModifyOnboardingSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, reason, ...body } = p;
      return toolResult(await client.callApi("PUT", `/guilds/${guild_id}/onboarding`, body, undefined, reason));
    })
  );

  // Widget
  server.tool("get_widget_settings", "Get guild widget settings", GetWidgetSettingsSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/widget`)))
  );

  server.tool("modify_widget", "Modify guild widget settings", ModifyWidgetSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, reason, ...body } = p;
      return toolResult(await client.callApi("PATCH", `/guilds/${guild_id}/widget`, body, undefined, reason));
    })
  );

  // Vanity URL
  server.tool("get_vanity_url", "Get the guild vanity URL", GetVanityUrlSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/vanity-url`)))
  );

  // Prune
  server.tool("get_prune_count", "Get the number of members that would be pruned", GetPruneCountSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, ...query } = p;
      return toolResult(await client.callApi("GET", `/guilds/${guild_id}/prune`, undefined, query as Record<string, string | number | boolean | undefined>));
    })
  );

  server.tool("begin_prune", "Begin pruning inactive members", BeginPruneSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, reason, ...body } = p;
      return toolResult(await client.callApi("POST", `/guilds/${guild_id}/prune`, body, undefined, reason));
    })
  );

  // Audit Log
  server.tool("get_audit_log", "Get the guild audit log", GetAuditLogSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, ...query } = p;
      return toolResult(await client.callApi("GET", `/guilds/${guild_id}/audit-logs`, undefined, query as Record<string, string | number | boolean | undefined>));
    })
  );
}
