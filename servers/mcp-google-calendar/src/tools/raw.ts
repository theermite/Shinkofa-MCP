import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GoogleCalendarClient } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerRawTool(server: McpServer, client: GoogleCalendarClient): void {
  server.tool(
    "raw_api_call",
    "Call any Google Calendar API v3 endpoint directly. Use for watch channels, stop channels, or any other uncovered endpoint.",
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
