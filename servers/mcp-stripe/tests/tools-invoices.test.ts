import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../src/lib/client.js";
import { registerInvoiceTools } from "../src/tools/invoices.js";

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

  registerInvoiceTools(server, client);
});

describe("Invoice tools — callbacks", () => {
  it("should_create_invoice", async () => {
    const cb = registeredTools.get("create_invoice")!;
    await cb({ customer: "cus_123" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/invoices", {
      customer: "cus_123",
    });
  });

  it("should_get_invoice_with_encoded_id", async () => {
    const cb = registeredTools.get("get_invoice")!;
    await cb({ invoice_id: "in_123" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/invoices/in_123",
      undefined,
    );
  });

  it("should_finalize_invoice", async () => {
    const cb = registeredTools.get("finalize_invoice")!;
    await cb({ invoice_id: "in_123", auto_advance: true });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/invoices/in_123/finalize",
      { auto_advance: true },
    );
  });

  it("should_pay_invoice", async () => {
    const cb = registeredTools.get("pay_invoice")!;
    await cb({ invoice_id: "in_123", payment_method: "pm_456" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/invoices/in_123/pay",
      { payment_method: "pm_456" },
    );
  });

  it("should_send_invoice", async () => {
    const cb = registeredTools.get("send_invoice")!;
    await cb({ invoice_id: "in_123" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/invoices/in_123/send",
    );
  });

  it("should_void_invoice", async () => {
    const cb = registeredTools.get("void_invoice")!;
    await cb({ invoice_id: "in_123" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/invoices/in_123/void",
    );
  });

  it("should_delete_draft_invoice", async () => {
    const cb = registeredTools.get("delete_draft_invoice")!;
    await cb({ invoice_id: "in_123" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "DELETE",
      "/invoices/in_123",
    );
  });

  it("should_update_invoice", async () => {
    const cb = registeredTools.get("update_invoice")!;
    await cb({ invoice_id: "in_123", description: "Updated" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/invoices/in_123",
      { description: "Updated" },
    );
  });

  it("should_list_invoices_with_filters", async () => {
    const cb = registeredTools.get("list_invoices")!;
    await cb({ customer: "cus_123", status: "paid", limit: 10 });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/invoices", {
      customer: "cus_123",
      status: "paid",
      limit: 10,
    });
  });
});
