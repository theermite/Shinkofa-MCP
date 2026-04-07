import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../lib/client.js";
import { CreateInvoiceSchema, GetInvoiceSchema, ListInvoicesSchema, UpdateInvoiceSchema, FinalizeInvoiceSchema, PayInvoiceSchema, SendInvoiceSchema, VoidInvoiceSchema, DeleteDraftInvoiceSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerInvoiceTools(server: McpServer, client: StripeClient): void {
  server.tool("create_invoice", "Create a draft invoice", CreateInvoiceSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/invoices", p as Record<string, unknown>));
  });
  server.tool("get_invoice", "Get an invoice", GetInvoiceSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/invoices/${p.invoice_id}`, p.expand ? { expand: p.expand } : undefined));
  });
  server.tool("list_invoices", "List invoices", ListInvoicesSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/invoices", p as Record<string, unknown>));
  });
  server.tool("update_invoice", "Update a draft invoice", UpdateInvoiceSchema.shape, async (p) => {
    const { invoice_id, ...params } = p;
    return toolResult(await client.callApi("POST", `/invoices/${invoice_id}`, params));
  });
  server.tool("finalize_invoice", "Finalize a draft invoice (ready for payment)", FinalizeInvoiceSchema.shape, async (p) => {
    const { invoice_id, ...params } = p;
    return toolResult(await client.callApi("POST", `/invoices/${invoice_id}/finalize`, params));
  });
  server.tool("pay_invoice", "Pay an open invoice", PayInvoiceSchema.shape, async (p) => {
    const { invoice_id, ...params } = p;
    return toolResult(await client.callApi("POST", `/invoices/${invoice_id}/pay`, params));
  });
  server.tool("send_invoice", "Send an invoice email to the customer", SendInvoiceSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", `/invoices/${p.invoice_id}/send`));
  });
  server.tool("void_invoice", "Void an open invoice", VoidInvoiceSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", `/invoices/${p.invoice_id}/void`));
  });
  server.tool("delete_draft_invoice", "Delete a draft invoice", DeleteDraftInvoiceSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/invoices/${p.invoice_id}`));
  });
}
