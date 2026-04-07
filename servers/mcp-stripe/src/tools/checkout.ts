import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../lib/client.js";
import { CreateCheckoutSessionSchema, GetCheckoutSessionSchema, ListCheckoutSessionsSchema, ExpireCheckoutSessionSchema, CreatePaymentLinkSchema, GetPaymentLinkSchema, UpdatePaymentLinkSchema, ListPaymentLinksSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerCheckoutTools(server: McpServer, client: StripeClient): void {
  server.tool("create_checkout_session", "Create a Stripe Checkout session (payment, subscription, or setup)", CreateCheckoutSessionSchema.shape, async (p) => { return toolResult(await client.callApi("POST", "/checkout/sessions", p as Record<string, unknown>)); });
  server.tool("get_checkout_session", "Get a Checkout session", GetCheckoutSessionSchema.shape, async (p) => { return toolResult(await client.callApi("GET", `/checkout/sessions/${p.session_id}`, p.expand ? { expand: p.expand } : undefined)); });
  server.tool("list_checkout_sessions", "List Checkout sessions", ListCheckoutSessionsSchema.shape, async (p) => { return toolResult(await client.callApi("GET", "/checkout/sessions", p as Record<string, unknown>)); });
  server.tool("expire_checkout_session", "Expire an open Checkout session", ExpireCheckoutSessionSchema.shape, async (p) => { return toolResult(await client.callApi("POST", `/checkout/sessions/${p.session_id}/expire`)); });

  server.tool("create_payment_link", "Create a shareable payment link", CreatePaymentLinkSchema.shape, async (p) => { return toolResult(await client.callApi("POST", "/payment_links", p as Record<string, unknown>)); });
  server.tool("get_payment_link", "Get a payment link", GetPaymentLinkSchema.shape, async (p) => { return toolResult(await client.callApi("GET", `/payment_links/${p.payment_link_id}`)); });
  server.tool("update_payment_link", "Update a payment link", UpdatePaymentLinkSchema.shape, async (p) => { const { payment_link_id, ...params } = p; return toolResult(await client.callApi("POST", `/payment_links/${payment_link_id}`, params)); });
  server.tool("list_payment_links", "List payment links", ListPaymentLinksSchema.shape, async (p) => { return toolResult(await client.callApi("GET", "/payment_links", p as Record<string, unknown>)); });
}
