/**
 * Invite tools — get and delete invites.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DiscordClient } from "../lib/client.js";
import { DeleteInviteSchema, GetInviteSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerInviteTools(server: McpServer, client: DiscordClient): void {
  server.tool("get_invite", "Get an invite by code", GetInviteSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { invite_code, ...query } = p;
      return toolResult(
        await client.callApi(
          "GET",
          `/invites/${invite_code}`,
          undefined,
          query as Record<string, string | number | boolean | undefined>,
        ),
      );
    }),
  );

  server.tool("delete_invite", "Delete/revoke an invite", DeleteInviteSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("DELETE", `/invites/${p.invite_code}`, undefined, undefined, p.reason)),
    ),
  );
}
