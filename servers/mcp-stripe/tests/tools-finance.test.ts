import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StripeClient } from "../src/lib/client.js";
import { registerFinanceTools } from "../src/tools/finance.js";

let server: McpServer;
let client: StripeClient;
let callApiSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: any[]) => any>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new StripeClient({ secretKey: "sk_test_123" });
  callApiSpy = vi.spyOn(client, "callApi").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as any);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerFinanceTools(server, client);
});

describe("Finance tools — balance", () => {
  it("should_get_balance", async () => {
    const cb = registeredTools.get("get_balance")!;
    await cb({});
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/balance");
  });

  it("should_list_balance_transactions", async () => {
    const cb = registeredTools.get("list_balance_transactions")!;
    await cb({ type: "charge", limit: 25 });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/balance_transactions", { type: "charge", limit: 25 });
  });
});

describe("Finance tools — payouts", () => {
  it("should_create_payout", async () => {
    const cb = registeredTools.get("create_payout")!;
    await cb({ amount: 10000, currency: "eur" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/payouts", {
      amount: 10000,
      currency: "eur",
    });
  });

  it("should_get_payout_with_expand", async () => {
    const cb = registeredTools.get("get_payout")!;
    await cb({
      payout_id: "po_123",
      expand: ["destination"],
    });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/payouts/po_123", { expand: ["destination"] });
  });

  it("should_cancel_payout", async () => {
    const cb = registeredTools.get("cancel_payout")!;
    await cb({ payout_id: "po_123" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/payouts/po_123/cancel");
  });
});

describe("Finance tools — disputes", () => {
  it("should_get_dispute", async () => {
    const cb = registeredTools.get("get_dispute")!;
    await cb({ dispute_id: "dp_123" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/disputes/dp_123", undefined);
  });

  it("should_update_dispute_with_evidence", async () => {
    const cb = registeredTools.get("update_dispute")!;
    await cb({
      dispute_id: "dp_123",
      evidence: { customer_email_address: "jay@test.com" },
    });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/disputes/dp_123", {
      evidence: { customer_email_address: "jay@test.com" },
    });
  });

  it("should_close_dispute", async () => {
    const cb = registeredTools.get("close_dispute")!;
    await cb({ dispute_id: "dp_123" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/disputes/dp_123/close");
  });
});

describe("Finance tools — webhooks", () => {
  it("should_create_webhook", async () => {
    const cb = registeredTools.get("create_webhook_endpoint")!;
    await cb({
      url: "https://shinkofa.com/webhook",
      enabled_events: ["invoice.paid"],
    });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/webhook_endpoints", {
      url: "https://shinkofa.com/webhook",
      enabled_events: ["invoice.paid"],
    });
  });

  it("should_get_webhook", async () => {
    const cb = registeredTools.get("get_webhook_endpoint")!;
    await cb({ webhook_id: "we_123" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/webhook_endpoints/we_123");
  });

  it("should_update_webhook", async () => {
    const cb = registeredTools.get("update_webhook_endpoint")!;
    await cb({ webhook_id: "we_123", disabled: true });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/webhook_endpoints/we_123", { disabled: true });
  });

  it("should_delete_webhook", async () => {
    const cb = registeredTools.get("delete_webhook_endpoint")!;
    await cb({ webhook_id: "we_123" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/webhook_endpoints/we_123");
  });
});

describe("Finance tools — events", () => {
  it("should_get_event", async () => {
    const cb = registeredTools.get("get_event")!;
    await cb({ event_id: "evt_123" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/events/evt_123");
  });

  it("should_list_events_with_type_filter", async () => {
    const cb = registeredTools.get("list_events")!;
    await cb({ type: "invoice.paid", limit: 50 });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/events", {
      type: "invoice.paid",
      limit: 50,
    });
  });
});
