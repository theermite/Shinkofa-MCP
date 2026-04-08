/**
 * Raw API call tool — 100% coverage of all Discord REST API v10 endpoints.
 * Use this for any endpoint not exposed as a dedicated tool.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient, DiscordError, DiscordRateLimitError } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, toolError } from "../lib/utils.js";

export function registerRawTool(server: McpServer, client: DiscordClient): void {
  server.tool(
    "raw_api_call",
    "Call any Discord REST API v10 endpoint directly. Use for endpoints not covered by dedicated tools (e.g. stickers, soundboard, stage instances, templates, voice states, polls, monetisation).",
    RawApiCallSchema.shape,
    async (params) => {
      try {
        const result = await client.callApi(
          params.method,
          params.path,
          params.body ?? undefined,
          params.query as Record<string, string | number | boolean | undefined> | undefined,
          params.reason,
        );
        return toolResult(result);
      } catch (error) {
        if (error instanceof DiscordRateLimitError) {
          return toolError(
            `Discord rate limit: retry after ${error.retryAfter}s${error.global ? " (global)" : ""}`,
          );
        }
        if (error instanceof DiscordError) {
          return toolError(
            `Discord API error ${error.httpStatus} (${error.code}): ${error.description}`,
          );
        }
        throw error;
      }
    },
  );
}
