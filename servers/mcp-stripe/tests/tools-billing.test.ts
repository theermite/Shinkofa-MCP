import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../src/lib/client.js";
import { registerBillingTools } from "../src/tools/billing.js";

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

  registerBillingTools(server, client);
});

describe("Billing tools — payment methods", () => {
  it("should_list_payment_methods", async () => {
    const cb = registeredTools.get("list_payment_methods")!;
    await cb({ customer: "cus_123", type: "card" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/payment_methods",
      { customer: "cus_123", type: "card" },
    );
  });

  it("should_get_payment_method_with_expand", async () => {
    const cb = registeredTools.get("get_payment_method")!;
    await cb({ payment_method_id: "pm_123", expand: ["customer"] });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/payment_methods/pm_123",
      { expand: ["customer"] },
    );
  });

  it("should_attach_payment_method", async () => {
    const cb = registeredTools.get("attach_payment_method")!;
    await cb({ payment_method_id: "pm_123", customer: "cus_123" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/payment_methods/pm_123/attach",
      { customer: "cus_123" },
    );
  });

  it("should_detach_payment_method", async () => {
    const cb = registeredTools.get("detach_payment_method")!;
    await cb({ payment_method_id: "pm_123" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/payment_methods/pm_123/detach",
    );
  });
});

describe("Billing tools — portal", () => {
  it("should_create_portal_session", async () => {
    const cb = registeredTools.get("create_billing_portal_session")!;
    await cb({
      customer: "cus_123",
      return_url: "https://shinkofa.com",
    });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/billing_portal/sessions",
      {
        customer: "cus_123",
        return_url: "https://shinkofa.com",
      },
    );
  });
});
