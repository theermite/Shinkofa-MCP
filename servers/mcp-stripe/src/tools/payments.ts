import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../lib/client.js";
import { CreatePaymentIntentSchema, GetPaymentIntentSchema, ListPaymentIntentsSchema, UpdatePaymentIntentSchema, ConfirmPaymentIntentSchema, CapturePaymentIntentSchema, CancelPaymentIntentSchema, CreateRefundSchema, GetRefundSchema, ListRefundsSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerPaymentTools(server: McpServer, client: StripeClient): void {
  server.tool("create_payment_intent", "Create a PaymentIntent to collect a payment", CreatePaymentIntentSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/payment_intents", p as Record<string, unknown>));
  });
  server.tool("get_payment_intent", "Get a PaymentIntent", GetPaymentIntentSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/payment_intents/${p.payment_intent_id}`, p.expand ? { expand: p.expand } : undefined));
  });
  server.tool("list_payment_intents", "List PaymentIntents", ListPaymentIntentsSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/payment_intents", p as Record<string, unknown>));
  });
  server.tool("update_payment_intent", "Update a PaymentIntent", UpdatePaymentIntentSchema.shape, async (p) => {
    const { payment_intent_id, ...params } = p;
    return toolResult(await client.callApi("POST", `/payment_intents/${payment_intent_id}`, params));
  });
  server.tool("confirm_payment_intent", "Confirm a PaymentIntent", ConfirmPaymentIntentSchema.shape, async (p) => {
    const { payment_intent_id, ...params } = p;
    return toolResult(await client.callApi("POST", `/payment_intents/${payment_intent_id}/confirm`, params));
  });
  server.tool("capture_payment_intent", "Capture an authorized PaymentIntent", CapturePaymentIntentSchema.shape, async (p) => {
    const { payment_intent_id, ...params } = p;
    return toolResult(await client.callApi("POST", `/payment_intents/${payment_intent_id}/capture`, params));
  });
  server.tool("cancel_payment_intent", "Cancel a PaymentIntent", CancelPaymentIntentSchema.shape, async (p) => {
    const { payment_intent_id, ...params } = p;
    return toolResult(await client.callApi("POST", `/payment_intents/${payment_intent_id}/cancel`, params));
  });
  server.tool("create_refund", "Refund a payment (full or partial)", CreateRefundSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/refunds", p as Record<string, unknown>));
  });
  server.tool("get_refund", "Get a refund", GetRefundSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/refunds/${p.refund_id}`, p.expand ? { expand: p.expand } : undefined));
  });
  server.tool("list_refunds", "List refunds", ListRefundsSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/refunds", p as Record<string, unknown>));
  });
}
