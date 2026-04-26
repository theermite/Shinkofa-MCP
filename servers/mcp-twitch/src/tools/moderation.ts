/**
 * Moderation tools — bans, automod, blocked terms, shield mode, moderators, warnings, unban requests.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TwitchClient } from "../lib/client.js";
import {
  AddBlockedTermSchema,
  AddRemoveModeratorSchema,
  BanUserSchema,
  GetAutoModSettingsSchema,
  GetBannedUsersSchema,
  GetBlockedTermsSchema,
  GetModeratorsSchema,
  GetShieldModeSchema,
  GetUnbanRequestsSchema,
  RemoveBlockedTermSchema,
  ResolveUnbanRequestSchema,
  UnbanUserSchema,
  UpdateAutoModSettingsSchema,
  UpdateShieldModeSchema,
  WarnUserSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerModerationTools(server: McpServer, client: TwitchClient): void {
  server.tool("get_banned_users", "Get list of banned/timed-out users", GetBannedUsersSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          "/moderation/banned",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );

  server.tool("ban_user", "Ban or timeout a user", BanUserSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { broadcaster_id, moderator_id, ...data } = p;
      return toolResult(await client.callApi("POST", "/moderation/bans", { data }, { broadcaster_id, moderator_id }));
    }),
  );

  server.tool("unban_user", "Unban a user or remove a timeout", UnbanUserSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "DELETE",
          "/moderation/bans",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );

  server.tool("get_blocked_terms", "Get blocked terms for a channel", GetBlockedTermsSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          "/moderation/blocked_terms",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );

  server.tool("add_blocked_term", "Add a blocked term to a channel", AddBlockedTermSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { broadcaster_id, moderator_id, text } = p;
      return toolResult(
        await client.callApi("POST", "/moderation/blocked_terms", { text }, { broadcaster_id, moderator_id }),
      );
    }),
  );

  server.tool("remove_blocked_term", "Remove a blocked term", RemoveBlockedTermSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "DELETE",
          "/moderation/blocked_terms",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );

  server.tool("get_moderators", "Get list of channel moderators", GetModeratorsSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          "/moderation/moderators",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );

  server.tool("add_moderator", "Add a channel moderator", AddRemoveModeratorSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "POST",
          "/moderation/moderators",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );

  server.tool("remove_moderator", "Remove a channel moderator", AddRemoveModeratorSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "DELETE",
          "/moderation/moderators",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );

  server.tool("get_shield_mode", "Get Shield Mode status", GetShieldModeSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          "/moderation/shield_mode",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );

  server.tool("update_shield_mode", "Activate or deactivate Shield Mode", UpdateShieldModeSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { broadcaster_id, moderator_id, is_active } = p;
      return toolResult(
        await client.callApi("PUT", "/moderation/shield_mode", { is_active }, { broadcaster_id, moderator_id }),
      );
    }),
  );

  server.tool("get_automod_settings", "Get AutoMod settings for a channel", GetAutoModSettingsSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          "/automod/settings",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );

  server.tool("update_automod_settings", "Update AutoMod settings", UpdateAutoModSettingsSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { broadcaster_id, moderator_id, ...body } = p;
      return toolResult(await client.callApi("PUT", "/automod/settings", body, { broadcaster_id, moderator_id }));
    }),
  );

  server.tool("warn_user", "Warn a user in chat", WarnUserSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { broadcaster_id, moderator_id, ...data } = p;
      return toolResult(
        await client.callApi("POST", "/moderation/warnings", { data }, { broadcaster_id, moderator_id }),
      );
    }),
  );

  server.tool("get_unban_requests", "Get unban requests for a channel", GetUnbanRequestsSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          "/moderation/unban_requests",
          undefined,
          p as Record<string, string | number | boolean | string[] | undefined>,
        ),
      ),
    ),
  );

  server.tool("resolve_unban_request", "Approve or deny an unban request", ResolveUnbanRequestSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { broadcaster_id, moderator_id, unban_request_id, status, resolution_text } = p;
      return toolResult(
        await client.callApi(
          "PATCH",
          "/moderation/unban_requests",
          { unban_request_id, status, resolution_text },
          { broadcaster_id, moderator_id },
        ),
      );
    }),
  );
}
