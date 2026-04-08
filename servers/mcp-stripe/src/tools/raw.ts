import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerRawTool(
  server: McpServer,
  client: StripeClient,
): void {
  server.tool(
    "raw_api_call",
    "Call any Stripe API endpoint directly. Use for: tax, quotes, credit notes, setup intents, charges, subscription schedules, subscription items, invoice items, billing meters, identity, radar, files, connect, issuing, terminal, treasury, reporting, etc.",
    RawApiCallSchema.shape,
    async (params) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            params.method,
            params.path,
            params.params ?? undefined,
          ),
        ),
      ),
  );
}
