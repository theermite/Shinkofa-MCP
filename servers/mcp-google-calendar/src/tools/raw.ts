import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GoogleCalendarClient, GoogleCalendarError } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, toolError } from "../lib/utils.js";

export function registerRawTool(server: McpServer, client: GoogleCalendarClient): void {
  server.tool(
    "raw_api_call",
    "Call any Google Calendar API v3 endpoint directly. Use for watch channels, stop channels, or any other uncovered endpoint.",
    RawApiCallSchema.shape,
    async (params) => {
      try {
        const result = await client.callApi(params.method, params.path, params.body ?? undefined, params.query as Record<string, string | number | boolean | undefined> | undefined);
        return toolResult(result);
      } catch (error) {
        if (error instanceof GoogleCalendarError) {
          return toolError(`Google Calendar error ${error.code}: ${error.description}`);
        }
        throw error;
      }
    },
  );
}
