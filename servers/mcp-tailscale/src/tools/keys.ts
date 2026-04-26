import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TailscaleClient } from "../lib/client.js";
import { CreateAuthKeySchema, KeyIdSchema, ListKeysSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerKeyTools(server: McpServer, client: TailscaleClient) {
  server.tool("list_keys", "List all auth keys and API tokens for the tailnet", ListKeysSchema.shape, async () =>
    withErrorHandler(async () => {
      const result = await client.get(client.tailnetPath("/keys"));
      return toolResult(result);
    }),
  );

  server.tool("create_auth_key", "Create a new auth key for device enrollment", CreateAuthKeySchema.shape, async (p) =>
    withErrorHandler(async () => {
      const capabilities: Record<string, unknown> = {
        devices: {
          create: {
            reusable: p.reusable,
            ephemeral: p.ephemeral,
            preauthorized: p.preauthorized,
            ...(p.tags && { tags: p.tags }),
          },
        },
      };
      const body: Record<string, unknown> = {
        capabilities,
        expirySeconds: p.expirySeconds,
      };
      if (p.description) body.description = p.description;
      const result = await client.post(client.tailnetPath("/keys"), body);
      return toolResult(result);
    }),
  );

  server.tool("delete_key", "Delete an auth key or API token by ID", KeyIdSchema.shape, async (p) =>
    withErrorHandler(async () => {
      await client.del(client.tailnetPath(`/keys/${encodeURIComponent(p.keyId)}`));
      return toolResult(undefined);
    }),
  );
}
