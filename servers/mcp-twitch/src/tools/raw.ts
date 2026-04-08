/**
 * Raw API call tool — 100% coverage of all Twitch Helix endpoints.
 * Use for: analytics, bits, charity, conduits, CCL, drops, extensions, goals, guest star, hype train, teams.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TwitchClient, TwitchError, TwitchRateLimitError } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, toolError } from "../lib/utils.js";

export function registerRawTool(server: McpServer, client: TwitchClient): void {
  server.tool(
    "raw_api_call",
    "Call any Twitch Helix API endpoint directly. Use for endpoints not covered by dedicated tools (analytics, bits, charity, conduits, drops, extensions, goals, guest star, hype train, teams, etc.).",
    RawApiCallSchema.shape,
    async (params) => {
      try {
        const result = await client.callApi(
          params.method,
          params.path,
          params.body ?? undefined,
          params.query as Record<string, string | number | boolean | string[] | undefined> | undefined,
        );
        return toolResult(result);
      } catch (error) {
        if (error instanceof TwitchRateLimitError) {
          return toolError(`Twitch rate limit: retry after ${error.retryAfter}s`);
        }
        if (error instanceof TwitchError) {
          return toolError(`Twitch API error ${error.status}: ${error.description}`);
        }
        throw error;
      }
    },
  );
}
