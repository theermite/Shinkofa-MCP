/**
 * Shared test helper for tool tests.
 */
import { vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TwitchClient } from "../src/lib/client.js";

export interface ToolTestContext {
  server: McpServer;
  client: TwitchClient;
  callApiSpy: ReturnType<typeof vi.spyOn>;
  registeredTools: Map<string, (...args: unknown[]) => unknown>;
}

export function createToolTestContext(): ToolTestContext {
  const server = new McpServer({ name: "test", version: "1.0.0" });
  const client = new TwitchClient({ clientId: "test_id", accessToken: "test_token" });
  const callApiSpy = vi.spyOn(client, "callApi").mockResolvedValue({});
  const registeredTools = new Map<string, (...args: unknown[]) => unknown>();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as (...a: unknown[]) => unknown);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  return { server, client, callApiSpy, registeredTools };
}
