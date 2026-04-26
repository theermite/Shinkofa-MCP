import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import { StripeClient } from "../src/lib/client.js";
import { registerBillingTools } from "../src/tools/billing.js";
import { registerCatalogTools } from "../src/tools/catalog.js";
import { registerCheckoutTools } from "../src/tools/checkout.js";
import { registerCustomerTools } from "../src/tools/customers.js";
import { registerFinanceTools } from "../src/tools/finance.js";
import { registerInvoiceTools } from "../src/tools/invoices.js";
import { registerPaymentTools } from "../src/tools/payments.js";
import { registerPromotionTools } from "../src/tools/promotions.js";
import { registerRawTool } from "../src/tools/raw.js";
import { registerSubscriptionTools } from "../src/tools/subscriptions.js";

function setup() {
  return {
    client: new StripeClient({ secretKey: "sk_test_123" }),
    server: new McpServer({ name: "test", version: "1.0.0" }),
  };
}

describe("Tool registration — no conflicts", () => {
  it("should_register_all_tool_modules_without_conflict", () => {
    const s = setup();
    expect(() => {
      registerCustomerTools(s.server, s.client);
      registerPaymentTools(s.server, s.client);
      registerSubscriptionTools(s.server, s.client);
      registerInvoiceTools(s.server, s.client);
      registerCatalogTools(s.server, s.client);
      registerPromotionTools(s.server, s.client);
      registerCheckoutTools(s.server, s.client);
      registerBillingTools(s.server, s.client);
      registerFinanceTools(s.server, s.client);
      registerRawTool(s.server, s.client);
    }).not.toThrow();
  });
});

describe("Tool registration — individual modules", () => {
  it("customers", () => {
    const s = setup();
    expect(() => registerCustomerTools(s.server, s.client)).not.toThrow();
  });
  it("payments", () => {
    const s = setup();
    expect(() => registerPaymentTools(s.server, s.client)).not.toThrow();
  });
  it("subscriptions", () => {
    const s = setup();
    expect(() => registerSubscriptionTools(s.server, s.client)).not.toThrow();
  });
  it("invoices", () => {
    const s = setup();
    expect(() => registerInvoiceTools(s.server, s.client)).not.toThrow();
  });
  it("catalog", () => {
    const s = setup();
    expect(() => registerCatalogTools(s.server, s.client)).not.toThrow();
  });
  it("promotions", () => {
    const s = setup();
    expect(() => registerPromotionTools(s.server, s.client)).not.toThrow();
  });
  it("checkout", () => {
    const s = setup();
    expect(() => registerCheckoutTools(s.server, s.client)).not.toThrow();
  });
  it("billing", () => {
    const s = setup();
    expect(() => registerBillingTools(s.server, s.client)).not.toThrow();
  });
  it("finance", () => {
    const s = setup();
    expect(() => registerFinanceTools(s.server, s.client)).not.toThrow();
  });
  it("raw", () => {
    const s = setup();
    expect(() => registerRawTool(s.server, s.client)).not.toThrow();
  });
});
