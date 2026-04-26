import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TailscaleClient } from "../lib/client.js";
import { SetDnsNameserversSchema, UpdateAclSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerPolicyTools(server: McpServer, client: TailscaleClient) {
  server.tool("get_acl", "Get the current ACL (HuJSON format with comments)", z.object({}).shape, async () =>
    withErrorHandler(async () => {
      const result = await client.request<string>("GET", client.tailnetPath("/acl"), undefined);
      return toolResult(result);
    }),
  );

  server.tool("update_acl", "Replace the tailnet ACL document", UpdateAclSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const contentType = p.format === "json" ? "application/json" : "application/hujson";
      const result = await client.request<unknown>("POST", client.tailnetPath("/acl"), p.acl, contentType);
      return toolResult(result);
    }),
  );

  server.tool("get_dns_nameservers", "Get tailnet DNS nameservers", z.object({}).shape, async () =>
    withErrorHandler(async () => {
      const result = await client.get(client.tailnetPath("/dns/nameservers"));
      return toolResult(result);
    }),
  );

  server.tool(
    "set_dns_nameservers",
    "Set tailnet DNS nameservers (overwrites all)",
    SetDnsNameserversSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const result = await client.post(client.tailnetPath("/dns/nameservers"), { dns: p.dns });
        return toolResult(result);
      }),
  );

  server.tool("get_dns_preferences", "Get tailnet DNS preferences (MagicDNS, etc.)", z.object({}).shape, async () =>
    withErrorHandler(async () => {
      const result = await client.get(client.tailnetPath("/dns/preferences"));
      return toolResult(result);
    }),
  );
}
