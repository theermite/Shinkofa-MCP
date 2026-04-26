import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { StripeClient } from "../lib/client.js";
import {
  CreateInvoiceSchema,
  DeleteDraftInvoiceSchema,
  FinalizeInvoiceSchema,
  GetInvoiceSchema,
  ListInvoicesSchema,
  PayInvoiceSchema,
  SendInvoiceSchema,
  UpdateInvoiceSchema,
  VoidInvoiceSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerInvoiceTools(server: McpServer, client: StripeClient): void {
  server.tool("create_invoice", "Create a draft invoice", CreateInvoiceSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("POST", "/invoices", p as Record<string, unknown>))),
  );

  server.tool("get_invoice", "Get an invoice", GetInvoiceSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(
        await client.callApi(
          "GET",
          `/invoices/${encodeURIComponent(p.invoice_id)}`,
          p.expand ? { expand: p.expand } : undefined,
        ),
      ),
    ),
  );

  server.tool("list_invoices", "List invoices", ListInvoicesSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", "/invoices", p as Record<string, unknown>))),
  );

  server.tool("update_invoice", "Update a draft invoice", UpdateInvoiceSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { invoice_id, ...params } = p;
      return toolResult(await client.callApi("POST", `/invoices/${encodeURIComponent(invoice_id)}`, params));
    }),
  );

  server.tool(
    "finalize_invoice",
    "Finalize a draft invoice (ready for payment)",
    FinalizeInvoiceSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const { invoice_id, ...params } = p;
        return toolResult(await client.callApi("POST", `/invoices/${encodeURIComponent(invoice_id)}/finalize`, params));
      }),
  );

  server.tool("pay_invoice", "Pay an open invoice", PayInvoiceSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { invoice_id, ...params } = p;
      return toolResult(await client.callApi("POST", `/invoices/${encodeURIComponent(invoice_id)}/pay`, params));
    }),
  );

  server.tool("send_invoice", "Send an invoice email to the customer", SendInvoiceSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("POST", `/invoices/${encodeURIComponent(p.invoice_id)}/send`)),
    ),
  );

  server.tool("void_invoice", "Void an open invoice", VoidInvoiceSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("POST", `/invoices/${encodeURIComponent(p.invoice_id)}/void`)),
    ),
  );

  server.tool("delete_draft_invoice", "Delete a draft invoice", DeleteDraftInvoiceSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("DELETE", `/invoices/${encodeURIComponent(p.invoice_id)}`)),
    ),
  );
}
