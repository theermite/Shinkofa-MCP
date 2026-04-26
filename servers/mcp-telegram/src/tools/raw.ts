import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TelegramClient } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas-bot.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerRawTool(server: McpServer, client: TelegramClient): void {
  server.tool(
    "raw_api_call",
    "Call any Telegram Bot API method directly. Use for methods not covered by dedicated tools",
    RawApiCallSchema.shape,
    async (p) => withErrorHandler(async () => toolResult(await client.callApi(p.method, p.params ?? undefined))),
  );
}
