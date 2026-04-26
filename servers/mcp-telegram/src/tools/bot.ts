import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TelegramClient } from "../lib/client.js";
import {
  DeleteMyCommandsSchema,
  DeleteWebhookSchema,
  GetMyCommandsSchema,
  GetStarTransactionsSchema,
  GetUpdatesSchema,
  SendInvoiceSchema,
  SetMyCommandsSchema,
  SetWebhookSchema,
} from "../lib/schemas-bot.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerBotTools(server: McpServer, client: TelegramClient): void {
  server.tool("get_me", "Get basic information about the bot (test your token)", {}, async () =>
    withErrorHandler(async () => toolResult(await client.callApi("getMe"))),
  );

  server.tool("set_my_commands", "Set the bot's command list (shown in menu)", SetMyCommandsSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("setMyCommands", p))),
  );

  server.tool("get_my_commands", "Get the current bot command list", GetMyCommandsSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("getMyCommands", p))),
  );

  server.tool("delete_my_commands", "Delete the bot's command list", DeleteMyCommandsSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("deleteMyCommands", p))),
  );

  server.tool("set_webhook", "Set a webhook URL to receive incoming updates", SetWebhookSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("setWebhook", p))),
  );

  server.tool("delete_webhook", "Remove the webhook integration", DeleteWebhookSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("deleteWebhook", p))),
  );

  server.tool("get_webhook_info", "Get current webhook status and configuration", {}, async () =>
    withErrorHandler(async () => toolResult(await client.callApi("getWebhookInfo"))),
  );

  server.tool(
    "get_updates",
    "Get incoming updates via long polling (for debugging)",
    GetUpdatesSchema.shape,
    async (p) => withErrorHandler(async () => toolResult(await client.callApi("getUpdates", p))),
  );

  server.tool(
    "send_invoice",
    "Send an invoice for payment (fiat or Telegram Stars)",
    SendInvoiceSchema.shape,
    async (p) => withErrorHandler(async () => toolResult(await client.callApi("sendInvoice", p))),
  );

  server.tool(
    "get_star_transactions",
    "Get the bot's Telegram Stars transaction history",
    GetStarTransactionsSchema.shape,
    async (p) => withErrorHandler(async () => toolResult(await client.callApi("getStarTransactions", p))),
  );
}
