/**
 * Raw API call tool — 100% coverage of all Telegram Bot API methods.
 * Use this for any method not exposed as a dedicated tool.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TelegramClient, TelegramError } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, toolError } from "../lib/utils.js";

export function registerRawTool(server: McpServer, client: TelegramClient): void {
  server.tool(
    "raw_api_call",
    "Call any Telegram Bot API method directly. Use for methods not covered by dedicated tools (e.g. sendChecklist, verifyUser, postStory, sendGift, etc.)",
    RawApiCallSchema.shape,
    async (params) => {
      try {
        const result = await client.callApi(params.method, params.params ?? undefined);
        return toolResult(result);
      } catch (error) {
        if (error instanceof TelegramError) {
          return toolError(
            `Telegram API error ${error.code}: ${error.description}` +
            (error.retryAfter ? ` (retry after ${error.retryAfter}s)` : "")
          );
        }
        throw error;
      }
    }
  );
}
