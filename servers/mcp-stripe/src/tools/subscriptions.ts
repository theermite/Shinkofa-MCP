import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../lib/client.js";
import {
  CreateSubscriptionSchema,
  UpdateSubscriptionSchema,
  GetSubscriptionSchema,
  ListSubscriptionsSchema,
  CancelSubscriptionSchema,
  ResumeSubscriptionSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerSubscriptionTools(
  server: McpServer,
  client: StripeClient,
): void {
  server.tool(
    "create_subscription",
    "Create a subscription (Musha/Samurai/Sensei tiers)",
    CreateSubscriptionSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "POST",
            "/subscriptions",
            p as Record<string, unknown>,
          ),
        ),
      ),
  );

  server.tool(
    "update_subscription",
    "Update a subscription (change plan, add items, etc.)",
    UpdateSubscriptionSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const { subscription_id, ...params } = p;
        return toolResult(
          await client.callApi(
            "POST",
            `/subscriptions/${encodeURIComponent(subscription_id)}`,
            params,
          ),
        );
      }),
  );

  server.tool(
    "get_subscription",
    "Get a subscription",
    GetSubscriptionSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "GET",
            `/subscriptions/${encodeURIComponent(p.subscription_id)}`,
            p.expand ? { expand: p.expand } : undefined,
          ),
        ),
      ),
  );

  server.tool(
    "list_subscriptions",
    "List subscriptions",
    ListSubscriptionsSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "GET",
            "/subscriptions",
            p as Record<string, unknown>,
          ),
        ),
      ),
  );

  server.tool(
    "cancel_subscription",
    "Cancel a subscription",
    CancelSubscriptionSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const { subscription_id, ...params } = p;
        return toolResult(
          await client.callApi(
            "DELETE",
            `/subscriptions/${encodeURIComponent(subscription_id)}`,
            params,
          ),
        );
      }),
  );

  server.tool(
    "resume_subscription",
    "Resume a paused subscription",
    ResumeSubscriptionSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const { subscription_id, ...params } = p;
        return toolResult(
          await client.callApi(
            "POST",
            `/subscriptions/${encodeURIComponent(subscription_id)}/resume`,
            params,
          ),
        );
      }),
  );
}
