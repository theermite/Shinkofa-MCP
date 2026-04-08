/**
 * User tools — get current user, get user, create DM.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient } from "../lib/client.js";
import { GetUserSchema, CreateDMSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerUserTools(server: McpServer, client: DiscordClient): void {
  server.tool("get_current_user", "Get the current bot user", {}, async () => {
    return toolResult(await client.callApi("GET", "/users/@me"));
  });

  server.tool("get_user", "Get a user by ID", GetUserSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/users/${p.user_id}`));
  });

  server.tool("get_current_user_guilds", "Get guilds the bot is in", {}, async () => {
    return toolResult(await client.callApi("GET", "/users/@me/guilds"));
  });

  server.tool("create_dm", "Open a DM channel with a user", CreateDMSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/users/@me/channels", { recipient_id: p.recipient_id }));
  });
}
