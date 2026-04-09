/**
 * Raw API call tool — 100% coverage of all Discord REST API v10 endpoints.
 * Use this for any endpoint not exposed as a dedicated tool.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerRawTool(server: McpServer, client: DiscordClient): void {
  server.tool(
    "raw_api_call",
    "Call any Discord REST API v10 endpoint directly. Use for endpoints not covered by dedicated tools (e.g. stickers, soundboard, stage instances, templates, voice states, polls, monetisation).",
    RawApiCallSchema.shape,
    async (params) =>
      withErrorHandler(async () => {
        const result = await client.callApi(
          params.method,
          params.path,
          params.body ?? undefined,
          params.query as Record<string, string | number | boolean | undefined> | undefined,
          params.reason,
        );
        return toolResult(result);
      }),
  );
}
