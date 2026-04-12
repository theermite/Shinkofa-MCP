import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HashnodeClient } from "../lib/client.js";
import { RawGraphQLSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerRawTools(
  server: McpServer,
  client: HashnodeClient,
): void {
  server.tool(
    "raw_graphql",
    "Execute a raw GraphQL query or mutation (100% coverage fallback)",
    RawGraphQLSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(await client.query(p.query, p.variables)),
      ),
  );
}
