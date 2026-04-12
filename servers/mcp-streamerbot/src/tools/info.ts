/**
 * Info tools — server info, actions, commands, broadcaster, viewers.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { StreamerbotClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerInfoTools(server: McpServer, client: StreamerbotClient): void {
  server.tool("sb-get-info", "Get Streamer.bot instance information (version, OS, connected platforms)", {}, async () => {
    return withErrorHandler(async () => {
      const res = await client.sendRequest("GetInfo");
      return toolResult(res);
    });
  });

  server.tool("sb-get-actions", "List all available Streamer.bot actions", {}, async () => {
    return withErrorHandler(async () => {
      const res = await client.sendRequest("GetActions");
      return toolResult(res);
    });
  });

  server.tool("sb-get-commands", "List all defined chat commands in Streamer.bot", {}, async () => {
    return withErrorHandler(async () => {
      const res = await client.sendRequest("GetCommands");
      return toolResult(res);
    });
  });

  server.tool("sb-get-broadcaster", "Get broadcaster account information", {}, async () => {
    return withErrorHandler(async () => {
      const res = await client.sendRequest("GetBroadcaster");
      return toolResult(res);
    });
  });

  server.tool("sb-get-active-viewers", "List currently active viewers", {}, async () => {
    return withErrorHandler(async () => {
      const res = await client.sendRequest("GetActiveViewers");
      return toolResult(res);
    });
  });
}
