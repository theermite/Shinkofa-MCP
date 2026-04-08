import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient, StripeError } from "../src/lib/client.js";
import { registerSubscriptionTools } from "../src/tools/subscriptions.js";

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

  registerSubscriptionTools(server, client);
});

describe("Subscription tools — callbacks", () => {
  it("should_create_subscription", async () => {
    const cb = registeredTools.get("create_subscription")!;
    await cb({ customer: "cus_123", items: [{ price: "price_123" }] });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/subscriptions", {
      customer: "cus_123",
      items: [{ price: "price_123" }],
    });
  });

  it("should_update_subscription_with_encoded_id", async () => {
    const cb = registeredTools.get("update_subscription")!;
    await cb({
      subscription_id: "sub_123",
      cancel_at_period_end: true,
    });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/subscriptions/sub_123",
      { cancel_at_period_end: true },
    );
  });

  it("should_get_subscription_with_expand", async () => {
    const cb = registeredTools.get("get_subscription")!;
    await cb({
      subscription_id: "sub_123",
      expand: ["latest_invoice"],
    });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/subscriptions/sub_123",
      { expand: ["latest_invoice"] },
    );
  });

  it("should_cancel_subscription_via_DELETE", async () => {
    const cb = registeredTools.get("cancel_subscription")!;
    await cb({
      subscription_id: "sub_123",
      cancellation_details: { feedback: "too_expensive" },
    });
    expect(callApiSpy).toHaveBeenCalledWith(
      "DELETE",
      "/subscriptions/sub_123",
      { cancellation_details: { feedback: "too_expensive" } },
    );
  });

  it("should_resume_subscription", async () => {
    const cb = registeredTools.get("resume_subscription")!;
    await cb({
      subscription_id: "sub_123",
      billing_cycle_anchor: "now",
    });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/subscriptions/sub_123/resume",
      { billing_cycle_anchor: "now" },
    );
  });

  it("should_list_subscriptions_with_status_filter", async () => {
    const cb = registeredTools.get("list_subscriptions")!;
    await cb({ status: "active", limit: 25 });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/subscriptions",
      { status: "active", limit: 25 },
    );
  });

  it("should_handle_error_on_cancel", async () => {
    callApiSpy.mockRejectedValue(
      new StripeError(400, "invalid_request_error", undefined, "Cannot cancel"),
    );
    const cb = registeredTools.get("cancel_subscription")!;
    const result = await cb({ subscription_id: "sub_x" });
    expect(result.isError).toBe(true);
  });
});
