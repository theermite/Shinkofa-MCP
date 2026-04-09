import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianClient } from "../src/lib/client.js";
import { registerVaultTools } from "../src/tools/vault.js";

describe("Tool registration", () => {
  it("should_register_all_18_tools", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    const client = new ObsidianClient({ apiKey: "test_key" });
    const registeredNames: string[] = [];

    const origTool = server.tool.bind(server);
    server.tool = ((...args: unknown[]) => {
      registeredNames.push(args[0] as string);
      return origTool(...(args as Parameters<typeof origTool>));
    }) as typeof server.tool;

    registerVaultTools(server, client);

    expect(registeredNames).toHaveLength(18);
    expect(registeredNames).toContain("get_note");
    expect(registeredNames).toContain("create_note");
    expect(registeredNames).toContain("update_note");
    expect(registeredNames).toContain("append_to_note");
    expect(registeredNames).toContain("prepend_to_note");
    expect(registeredNames).toContain("delete_note");
    expect(registeredNames).toContain("list_files");
    expect(registeredNames).toContain("search_vault");
    expect(registeredNames).toContain("search_vault_jsonlogic");
    expect(registeredNames).toContain("get_active_file");
    expect(registeredNames).toContain("update_active_file");
    expect(registeredNames).toContain("append_to_active_file");
    expect(registeredNames).toContain("list_commands");
    expect(registeredNames).toContain("execute_command");
    expect(registeredNames).toContain("open_note");
    expect(registeredNames).toContain("get_periodic_note");
    expect(registeredNames).toContain("get_status");
    expect(registeredNames).toContain("raw_api_call");
  });
});
