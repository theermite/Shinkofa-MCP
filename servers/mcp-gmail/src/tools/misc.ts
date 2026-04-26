import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GmailClient } from "../lib/client.js";
import {
  GetProfileSchema,
  GetVacationSchema,
  ListHistorySchema,
  RawApiCallSchema,
  StopWatchSchema,
  UpdateVacationSchema,
  WatchSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerMiscTools(server: McpServer, client: GmailClient): void {
  server.tool(
    "list_history",
    "List mailbox history changes since a given historyId",
    ListHistorySchema.shape,
    async (p) => {
      return withErrorHandler(async () => {
        const { userId, ...query } = p;
        return toolResult(
          await client.callApi(
            "GET",
            `/users/${userId}/history`,
            undefined,
            query as Record<string, string | number | boolean | undefined>,
          ),
        );
      });
    },
  );

  server.tool(
    "get_profile",
    "Get Gmail profile (email, messages total, threads total, history ID)",
    GetProfileSchema.shape,
    async (p) => {
      return withErrorHandler(async () => toolResult(await client.callApi("GET", `/users/${p.userId}/profile`)));
    },
  );

  server.tool("get_vacation_settings", "Get vacation auto-reply settings", GetVacationSchema.shape, async (p) => {
    return withErrorHandler(async () =>
      toolResult(await client.callApi("GET", `/users/${p.userId}/settings/vacation`)),
    );
  });

  server.tool(
    "update_vacation_settings",
    "Update vacation auto-reply settings",
    UpdateVacationSchema.shape,
    async (p) => {
      return withErrorHandler(async () => {
        const { userId, ...body } = p;
        return toolResult(await client.callApi("PUT", `/users/${userId}/settings/vacation`, body));
      });
    },
  );

  server.tool("watch_mailbox", "Set up push notifications via Google Cloud Pub/Sub", WatchSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const { userId, ...body } = p;
      return toolResult(await client.callApi("POST", `/users/${userId}/watch`, body));
    });
  });

  server.tool("stop_watch", "Stop push notifications", StopWatchSchema.shape, async (p) => {
    return withErrorHandler(async () => toolResult(await client.callApi("POST", `/users/${p.userId}/stop`)));
  });

  server.tool(
    "raw_api_call",
    "Call any Gmail API endpoint directly. Use for: settings (IMAP, POP, forwarding, language, filters, sendAs, delegates), CSE, S/MIME, and any other uncovered endpoint.",
    RawApiCallSchema.shape,
    async (params) => {
      return withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            params.method,
            params.path,
            params.body ?? undefined,
            params.query as Record<string, string | number | boolean | undefined> | undefined,
          ),
        ),
      );
    },
  );
}
