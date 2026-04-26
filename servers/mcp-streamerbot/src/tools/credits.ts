/**
 * Credits tools — get and clear stream credits.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { StreamerbotClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerCreditTools(server: McpServer, client: StreamerbotClient): void {
  server.tool("sb-get-credits", "Get stream credits data", {}, async () => {
    return withErrorHandler(async () => {
      const res = await client.sendRequest("GetCredits");
      return toolResult(res);
    });
  });

  server.tool("sb-clear-credits", "Clear/reset stream credits", {}, async () => {
    return withErrorHandler(async () => {
      const res = await client.sendRequest("ClearCredits");
      return toolResult(res);
    });
  });
}
