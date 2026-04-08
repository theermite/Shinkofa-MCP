import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient, StripeError } from "../src/lib/client.js";
import { registerPaymentTools } from "../src/tools/payments.js";

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

  registerPaymentTools(server, client);
});

describe("Payment tools — callbacks", () => {
  it("should_create_payment_intent", async () => {
    const cb = registeredTools.get("create_payment_intent")!;
    await cb({ amount: 2000, currency: "eur" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/payment_intents", {
      amount: 2000,
      currency: "eur",
    });
  });

  it("should_get_payment_intent_with_encoded_id", async () => {
    const cb = registeredTools.get("get_payment_intent")!;
    await cb({ payment_intent_id: "pi_123" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/payment_intents/pi_123",
      undefined,
    );
  });

  it("should_confirm_payment_intent", async () => {
    const cb = registeredTools.get("confirm_payment_intent")!;
    await cb({ payment_intent_id: "pi_123", payment_method: "pm_456" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/payment_intents/pi_123/confirm",
      { payment_method: "pm_456" },
    );
  });

  it("should_capture_payment_intent", async () => {
    const cb = registeredTools.get("capture_payment_intent")!;
    await cb({ payment_intent_id: "pi_123", amount_to_capture: 1000 });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/payment_intents/pi_123/capture",
      { amount_to_capture: 1000 },
    );
  });

  it("should_cancel_payment_intent", async () => {
    const cb = registeredTools.get("cancel_payment_intent")!;
    await cb({
      payment_intent_id: "pi_123",
      cancellation_reason: "duplicate",
    });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/payment_intents/pi_123/cancel",
      { cancellation_reason: "duplicate" },
    );
  });

  it("should_create_refund", async () => {
    const cb = registeredTools.get("create_refund")!;
    await cb({ payment_intent: "pi_123", amount: 500 });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/refunds", {
      payment_intent: "pi_123",
      amount: 500,
    });
  });

  it("should_get_refund_with_expand", async () => {
    const cb = registeredTools.get("get_refund")!;
    await cb({ refund_id: "re_123", expand: ["payment_intent"] });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/refunds/re_123", {
      expand: ["payment_intent"],
    });
  });

  it("should_list_refunds", async () => {
    const cb = registeredTools.get("list_refunds")!;
    await cb({ payment_intent: "pi_123", limit: 5 });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/refunds", {
      payment_intent: "pi_123",
      limit: 5,
    });
  });

  it("should_handle_StripeError_on_create", async () => {
    callApiSpy.mockRejectedValue(
      new StripeError(400, "invalid_request_error", "amount_too_small", "Amount must be at least 50 cents"),
    );
    const cb = registeredTools.get("create_payment_intent")!;
    const result = await cb({ amount: 1, currency: "eur" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("amount_too_small");
  });
});
