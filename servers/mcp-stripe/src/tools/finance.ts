import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../lib/client.js";
import { GetBalanceSchema, ListBalanceTransactionsSchema, CreatePayoutSchema, GetPayoutSchema, ListPayoutsSchema, CancelPayoutSchema, GetDisputeSchema, ListDisputesSchema, UpdateDisputeSchema, CloseDisputeSchema, CreateWebhookSchema, GetWebhookSchema, ListWebhooksSchema, UpdateWebhookSchema, DeleteWebhookSchema, GetEventSchema, ListEventsSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerFinanceTools(server: McpServer, client: StripeClient): void {
  // Balance
  server.tool("get_balance", "Get current Stripe account balance", GetBalanceSchema.shape, async () => { return toolResult(await client.callApi("GET", "/balance")); });
  server.tool("list_balance_transactions", "List balance transactions", ListBalanceTransactionsSchema.shape, async (p) => { return toolResult(await client.callApi("GET", "/balance_transactions", p as Record<string, unknown>)); });

  // Payouts
  server.tool("create_payout", "Create a payout to bank account", CreatePayoutSchema.shape, async (p) => { return toolResult(await client.callApi("POST", "/payouts", p as Record<string, unknown>)); });
  server.tool("get_payout", "Get a payout", GetPayoutSchema.shape, async (p) => { return toolResult(await client.callApi("GET", `/payouts/${p.payout_id}`, p.expand ? { expand: p.expand } : undefined)); });
  server.tool("list_payouts", "List payouts", ListPayoutsSchema.shape, async (p) => { return toolResult(await client.callApi("GET", "/payouts", p as Record<string, unknown>)); });
  server.tool("cancel_payout", "Cancel a pending payout", CancelPayoutSchema.shape, async (p) => { return toolResult(await client.callApi("POST", `/payouts/${p.payout_id}/cancel`)); });

  // Disputes
  server.tool("get_dispute", "Get a dispute", GetDisputeSchema.shape, async (p) => { return toolResult(await client.callApi("GET", `/disputes/${p.dispute_id}`, p.expand ? { expand: p.expand } : undefined)); });
  server.tool("list_disputes", "List disputes", ListDisputesSchema.shape, async (p) => { return toolResult(await client.callApi("GET", "/disputes", p as Record<string, unknown>)); });
  server.tool("update_dispute", "Submit evidence for a dispute", UpdateDisputeSchema.shape, async (p) => { const { dispute_id, ...params } = p; return toolResult(await client.callApi("POST", `/disputes/${dispute_id}`, params)); });
  server.tool("close_dispute", "Close a dispute (accept the chargeback)", CloseDisputeSchema.shape, async (p) => { return toolResult(await client.callApi("POST", `/disputes/${p.dispute_id}/close`)); });

  // Webhooks
  server.tool("create_webhook_endpoint", "Create a webhook endpoint", CreateWebhookSchema.shape, async (p) => { return toolResult(await client.callApi("POST", "/webhook_endpoints", p as Record<string, unknown>)); });
  server.tool("get_webhook_endpoint", "Get a webhook endpoint", GetWebhookSchema.shape, async (p) => { return toolResult(await client.callApi("GET", `/webhook_endpoints/${p.webhook_id}`)); });
  server.tool("list_webhook_endpoints", "List webhook endpoints", ListWebhooksSchema.shape, async (p) => { return toolResult(await client.callApi("GET", "/webhook_endpoints", p as Record<string, unknown>)); });
  server.tool("update_webhook_endpoint", "Update a webhook endpoint", UpdateWebhookSchema.shape, async (p) => { const { webhook_id, ...params } = p; return toolResult(await client.callApi("POST", `/webhook_endpoints/${webhook_id}`, params)); });
  server.tool("delete_webhook_endpoint", "Delete a webhook endpoint", DeleteWebhookSchema.shape, async (p) => { return toolResult(await client.callApi("DELETE", `/webhook_endpoints/${p.webhook_id}`)); });

  // Events
  server.tool("get_event", "Get a Stripe event", GetEventSchema.shape, async (p) => { return toolResult(await client.callApi("GET", `/events/${p.event_id}`)); });
  server.tool("list_events", "List recent events", ListEventsSchema.shape, async (p) => { return toolResult(await client.callApi("GET", "/events", p as Record<string, unknown>)); });
}
