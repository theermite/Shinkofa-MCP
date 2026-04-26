import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { StripeClient } from "../lib/client.js";
import {
  CancelPayoutSchema,
  CloseDisputeSchema,
  CreatePayoutSchema,
  CreateWebhookSchema,
  DeleteWebhookSchema,
  GetBalanceSchema,
  GetDisputeSchema,
  GetEventSchema,
  GetPayoutSchema,
  GetWebhookSchema,
  ListBalanceTransactionsSchema,
  ListDisputesSchema,
  ListEventsSchema,
  ListPayoutsSchema,
  ListWebhooksSchema,
  UpdateDisputeSchema,
  UpdateWebhookSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerFinanceTools(server: McpServer, client: StripeClient): void {
  // Balance
  server.tool("get_balance", "Get current Stripe account balance", GetBalanceSchema.shape, async () =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", "/balance"))),
  );

  server.tool(
    "list_balance_transactions",
    "List balance transactions",
    ListBalanceTransactionsSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(await client.callApi("GET", "/balance_transactions", p as Record<string, unknown>)),
      ),
  );

  // Payouts
  server.tool("create_payout", "Create a payout to bank account", CreatePayoutSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("POST", "/payouts", p as Record<string, unknown>))),
  );

  server.tool("get_payout", "Get a payout", GetPayoutSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          `/payouts/${encodeURIComponent(p.payout_id)}`,
          p.expand ? { expand: p.expand } : undefined,
        ),
      ),
    ),
  );

  server.tool("list_payouts", "List payouts", ListPayoutsSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", "/payouts", p as Record<string, unknown>))),
  );

  server.tool("cancel_payout", "Cancel a pending payout", CancelPayoutSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("POST", `/payouts/${encodeURIComponent(p.payout_id)}/cancel`)),
    ),
  );

  // Disputes
  server.tool("get_dispute", "Get a dispute", GetDisputeSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          `/disputes/${encodeURIComponent(p.dispute_id)}`,
          p.expand ? { expand: p.expand } : undefined,
        ),
      ),
    ),
  );

  server.tool("list_disputes", "List disputes", ListDisputesSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", "/disputes", p as Record<string, unknown>))),
  );

  server.tool("update_dispute", "Submit evidence for a dispute", UpdateDisputeSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { dispute_id, ...params } = p;
      return toolResult(await client.callApi("POST", `/disputes/${encodeURIComponent(dispute_id)}`, params));
    }),
  );

  server.tool("close_dispute", "Close a dispute (accept the chargeback)", CloseDisputeSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("POST", `/disputes/${encodeURIComponent(p.dispute_id)}/close`)),
    ),
  );

  // Webhooks
  server.tool("create_webhook_endpoint", "Create a webhook endpoint", CreateWebhookSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("POST", "/webhook_endpoints", p as Record<string, unknown>)),
    ),
  );

  server.tool("get_webhook_endpoint", "Get a webhook endpoint", GetWebhookSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", `/webhook_endpoints/${encodeURIComponent(p.webhook_id)}`)),
    ),
  );

  server.tool("list_webhook_endpoints", "List webhook endpoints", ListWebhooksSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/webhook_endpoints", p as Record<string, unknown>)),
    ),
  );

  server.tool("update_webhook_endpoint", "Update a webhook endpoint", UpdateWebhookSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { webhook_id, ...params } = p;
      return toolResult(await client.callApi("POST", `/webhook_endpoints/${encodeURIComponent(webhook_id)}`, params));
    }),
  );

  server.tool("delete_webhook_endpoint", "Delete a webhook endpoint", DeleteWebhookSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("DELETE", `/webhook_endpoints/${encodeURIComponent(p.webhook_id)}`)),
    ),
  );

  // Events
  server.tool("get_event", "Get a Stripe event", GetEventSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/events/${encodeURIComponent(p.event_id)}`))),
  );

  server.tool("list_events", "List recent events", ListEventsSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", "/events", p as Record<string, unknown>))),
  );
}
