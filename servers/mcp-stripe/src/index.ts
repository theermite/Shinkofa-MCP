#!/usr/bin/env node
/**
 * @shinkofa/mcp-stripe — MCP server for Stripe API.
 *
 * Typed tools for customers, payments, subscriptions, invoices, products,
 * prices, coupons, checkout, payment links, payment methods, billing portal,
 * balance, payouts, disputes, webhooks, events + raw_api_call for 100% coverage.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_xxx npx @shinkofa/mcp-stripe
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StripeClient } from "./lib/client.js";
import { registerBillingTools } from "./tools/billing.js";
import { registerCatalogTools } from "./tools/catalog.js";
import { registerCheckoutTools } from "./tools/checkout.js";
import { registerCustomerTools } from "./tools/customers.js";
import { registerFinanceTools } from "./tools/finance.js";
import { registerInvoiceTools } from "./tools/invoices.js";
import { registerPaymentTools } from "./tools/payments.js";
import { registerPromotionTools } from "./tools/promotions.js";
import { registerRawTool } from "./tools/raw.js";
import { registerSubscriptionTools } from "./tools/subscriptions.js";

async function main(): Promise<void> {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    console.error("Error: STRIPE_SECRET_KEY environment variable is required");
    process.exit(1);
  }

  const client = new StripeClient({
    secretKey,
    apiBaseUrl: process.env.STRIPE_API_BASE_URL,
    apiVersion: process.env.STRIPE_API_VERSION,
    timeoutMs: process.env.STRIPE_TIMEOUT_MS ? parseInt(process.env.STRIPE_TIMEOUT_MS, 10) || undefined : undefined,
  });

  const server = new McpServer({
    name: "@shinkofa/mcp-stripe",
    version: "1.0.0",
  });

  registerCustomerTools(server, client);
  registerPaymentTools(server, client);
  registerSubscriptionTools(server, client);
  registerInvoiceTools(server, client);
  registerCatalogTools(server, client);
  registerPromotionTools(server, client);
  registerCheckoutTools(server, client);
  registerBillingTools(server, client);
  registerFinanceTools(server, client);
  registerRawTool(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
