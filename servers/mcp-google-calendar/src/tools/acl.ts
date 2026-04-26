import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GoogleCalendarClient } from "../lib/client.js";
import {
  CreateAclRuleSchema,
  DeleteAclRuleSchema,
  FreeBusyQuerySchema,
  GetAclRuleSchema,
  GetSettingSchema,
  ListAclSchema,
  UpdateAclRuleSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerAclTools(server: McpServer, client: GoogleCalendarClient): void {
  server.tool("list_acl", "List access control rules for a calendar", ListAclSchema.shape, async (p) => {
    return withErrorHandler(async () =>
      toolResult(await client.callApi("GET", `/calendars/${encodeURIComponent(p.calendarId)}/acl`)),
    );
  });

  server.tool("get_acl_rule", "Get a specific ACL rule", GetAclRuleSchema.shape, async (p) => {
    return withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          `/calendars/${encodeURIComponent(p.calendarId)}/acl/${encodeURIComponent(p.ruleId)}`,
        ),
      ),
    );
  });

  server.tool("create_acl_rule", "Share a calendar (add ACL rule)", CreateAclRuleSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const { calendarId, sendNotifications, ...body } = p;
      return toolResult(
        await client.callApi(
          "POST",
          `/calendars/${encodeURIComponent(calendarId)}/acl`,
          body,
          sendNotifications !== undefined ? { sendNotifications } : undefined,
        ),
      );
    });
  });

  server.tool("update_acl_rule", "Update an ACL rule (change role)", UpdateAclRuleSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const { calendarId, ruleId, sendNotifications, ...body } = p;
      return toolResult(
        await client.callApi(
          "PATCH",
          `/calendars/${encodeURIComponent(calendarId)}/acl/${encodeURIComponent(ruleId)}`,
          body,
          sendNotifications !== undefined ? { sendNotifications } : undefined,
        ),
      );
    });
  });

  server.tool("delete_acl_rule", "Remove sharing (delete ACL rule)", DeleteAclRuleSchema.shape, async (p) => {
    return withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "DELETE",
          `/calendars/${encodeURIComponent(p.calendarId)}/acl/${encodeURIComponent(p.ruleId)}`,
        ),
      ),
    );
  });

  server.tool("query_freebusy", "Query free/busy information for calendars", FreeBusyQuerySchema.shape, async (p) => {
    return withErrorHandler(async () =>
      toolResult(await client.callApi("POST", "/freeBusy", p as Record<string, unknown>)),
    );
  });

  server.tool("list_settings", "List all user settings", {}, async () => {
    return withErrorHandler(async () => toolResult(await client.callApi("GET", "/users/me/settings")));
  });

  server.tool("get_setting", "Get a specific user setting", GetSettingSchema.shape, async (p) => {
    return withErrorHandler(async () =>
      toolResult(await client.callApi("GET", `/users/me/settings/${encodeURIComponent(p.setting)}`)),
    );
  });

  server.tool("get_colors", "Get available calendar and event colors", {}, async () => {
    return withErrorHandler(async () => toolResult(await client.callApi("GET", "/colors")));
  });
}
