import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../src/lib/client.js";
import { registerCheckoutTools } from "../src/tools/checkout.js";

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

  registerCheckoutTools(server, client);
});

describe("Checkout tools — sessions", () => {
  it("should_create_checkout_session", async () => {
    const cb = registeredTools.get("create_checkout_session")!;
    await cb({
      mode: "subscription",
      line_items: [{ price: "price_123", quantity: 1 }],
      success_url: "https://shinkofa.com/success",
    });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/checkout/sessions",
      {
        mode: "subscription",
        line_items: [{ price: "price_123", quantity: 1 }],
        success_url: "https://shinkofa.com/success",
      },
    );
  });

  it("should_get_checkout_session_with_expand", async () => {
    const cb = registeredTools.get("get_checkout_session")!;
    await cb({ session_id: "cs_123", expand: ["line_items"] });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/checkout/sessions/cs_123",
      { expand: ["line_items"] },
    );
  });

  it("should_expire_checkout_session", async () => {
    const cb = registeredTools.get("expire_checkout_session")!;
    await cb({ session_id: "cs_123" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/checkout/sessions/cs_123/expire",
    );
  });

  it("should_list_checkout_sessions", async () => {
    const cb = registeredTools.get("list_checkout_sessions")!;
    await cb({ status: "complete", limit: 10 });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/checkout/sessions",
      { status: "complete", limit: 10 },
    );
  });
});

describe("Checkout tools — payment links", () => {
  it("should_create_payment_link", async () => {
    const cb = registeredTools.get("create_payment_link")!;
    await cb({ line_items: [{ price: "price_123" }] });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/payment_links",
      { line_items: [{ price: "price_123" }] },
    );
  });

  it("should_get_payment_link", async () => {
    const cb = registeredTools.get("get_payment_link")!;
    await cb({ payment_link_id: "plink_123" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/payment_links/plink_123",
    );
  });

  it("should_update_payment_link", async () => {
    const cb = registeredTools.get("update_payment_link")!;
    await cb({ payment_link_id: "plink_123", active: false });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/payment_links/plink_123",
      { active: false },
    );
  });

  it("should_list_payment_links", async () => {
    const cb = registeredTools.get("list_payment_links")!;
    await cb({ active: true });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/payment_links", {
      active: true,
    });
  });
});
