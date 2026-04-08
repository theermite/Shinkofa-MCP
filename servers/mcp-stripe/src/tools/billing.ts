import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../lib/client.js";
import {
  ListPaymentMethodsSchema,
  GetPaymentMethodSchema,
  AttachPaymentMethodSchema,
  DetachPaymentMethodSchema,
  CreatePortalSessionSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerBillingTools(
  server: McpServer,
  client: StripeClient,
): void {
  server.tool(
    "list_payment_methods",
    "List payment methods for a customer",
    ListPaymentMethodsSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "GET",
            "/payment_methods",
            p as Record<string, unknown>,
          ),
        ),
      ),
  );

  server.tool(
    "get_payment_method",
    "Get a payment method",
    GetPaymentMethodSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "GET",
            `/payment_methods/${encodeURIComponent(p.payment_method_id)}`,
            p.expand ? { expand: p.expand } : undefined,
          ),
        ),
      ),
  );

  server.tool(
    "attach_payment_method",
    "Attach a payment method to a customer",
    AttachPaymentMethodSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "POST",
            `/payment_methods/${encodeURIComponent(p.payment_method_id)}/attach`,
            { customer: p.customer },
          ),
        ),
      ),
  );

  server.tool(
    "detach_payment_method",
    "Detach a payment method from a customer",
    DetachPaymentMethodSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "POST",
            `/payment_methods/${encodeURIComponent(p.payment_method_id)}/detach`,
          ),
        ),
      ),
  );

  server.tool(
    "create_billing_portal_session",
    "Create a customer billing portal session URL",
    CreatePortalSessionSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "POST",
            "/billing_portal/sessions",
            p as Record<string, unknown>,
          ),
        ),
      ),
  );
}
