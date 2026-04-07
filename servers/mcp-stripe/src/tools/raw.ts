import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient, StripeError } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, toolError } from "../lib/utils.js";

export function registerRawTool(server: McpServer, client: StripeClient): void {
  server.tool(
    "raw_api_call",
    "Call any Stripe API endpoint directly. Use for: tax, quotes, credit notes, setup intents, charges, subscription schedules, subscription items, invoice items, billing meters, identity, radar, files, connect, issuing, terminal, treasury, reporting, etc.",
    RawApiCallSchema.shape,
    async (params) => {
      try {
        const result = await client.callApi(params.method, params.path, params.params ?? undefined);
        return toolResult(result);
      } catch (error) {
        if (error instanceof StripeError) {
          return toolError(`Stripe error ${error.httpStatus} (${error.type}${error.code ? `/${error.code}` : ""}): ${error.description}`);
        }
        throw error;
      }
    },
  );
}
