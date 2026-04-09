import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient, DiscordError, DiscordRateLimitError } from "../src/lib/client.js";
import { registerCommandTools } from "../src/tools/commands.js";

let server: McpServer;
let client: DiscordClient;
let callApiSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: any[]) => any>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new DiscordClient({ botToken: "test_token" });
  callApiSpy = vi.spyOn(client, "callApi").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as any);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerCommandTools(server, client);
});

describe("list_commands", () => {
  it("should_call_GET_global_commands_when_no_guild_id", async () => {
    const handler = registeredTools.get("list_commands")!;
    await handler({ application_id: "app1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/applications/app1/commands", undefined, {});
  });

  it("should_call_GET_guild_commands_when_guild_id_provided", async () => {
    const handler = registeredTools.get("list_commands")!;
    await handler({ application_id: "app1", guild_id: "g1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/applications/app1/guilds/g1/commands", undefined, {});
  });

  it("should_include_with_localizations_query_when_provided", async () => {
    const handler = registeredTools.get("list_commands")!;
    await handler({ application_id: "app1", with_localizations: true });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/applications/app1/commands", undefined, { with_localizations: true });
  });
});

describe("create_command", () => {
  it("should_call_POST_global_commands_when_no_guild_id", async () => {
    const handler = registeredTools.get("create_command")!;
    await handler({ application_id: "app1", name: "ping", description: "Pong!" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/applications/app1/commands", { name: "ping", description: "Pong!" });
  });

  it("should_call_POST_guild_commands_when_guild_id_provided", async () => {
    const handler = registeredTools.get("create_command")!;
    await handler({ application_id: "app1", guild_id: "g1", name: "ping", description: "Pong!" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/applications/app1/guilds/g1/commands", { name: "ping", description: "Pong!" });
  });
});

describe("get_command", () => {
  it("should_call_GET_global_command_when_no_guild_id", async () => {
    const handler = registeredTools.get("get_command")!;
    await handler({ application_id: "app1", command_id: "cmd1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/applications/app1/commands/cmd1");
  });

  it("should_call_GET_guild_command_when_guild_id_provided", async () => {
    const handler = registeredTools.get("get_command")!;
    await handler({ application_id: "app1", guild_id: "g1", command_id: "cmd1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/applications/app1/guilds/g1/commands/cmd1");
  });
});

describe("modify_command", () => {
  it("should_call_PATCH_global_command_when_no_guild_id", async () => {
    const handler = registeredTools.get("modify_command")!;
    await handler({ application_id: "app1", command_id: "cmd1", description: "Updated" });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/applications/app1/commands/cmd1", { description: "Updated" });
  });

  it("should_call_PATCH_guild_command_when_guild_id_provided", async () => {
    const handler = registeredTools.get("modify_command")!;
    await handler({ application_id: "app1", guild_id: "g1", command_id: "cmd1", description: "Updated" });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/applications/app1/guilds/g1/commands/cmd1", { description: "Updated" });
  });
});

describe("delete_command", () => {
  it("should_call_DELETE_global_command_when_no_guild_id", async () => {
    const handler = registeredTools.get("delete_command")!;
    await handler({ application_id: "app1", command_id: "cmd1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/applications/app1/commands/cmd1");
  });

  it("should_call_DELETE_guild_command_when_guild_id_provided", async () => {
    const handler = registeredTools.get("delete_command")!;
    await handler({ application_id: "app1", guild_id: "g1", command_id: "cmd1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/applications/app1/guilds/g1/commands/cmd1");
  });
});

describe("bulk_overwrite_commands", () => {
  it("should_call_PUT_global_commands_when_no_guild_id", async () => {
    const handler = registeredTools.get("bulk_overwrite_commands")!;
    const commands = [{ name: "ping", description: "Pong!" }];
    await handler({ application_id: "app1", commands });
    expect(callApiSpy).toHaveBeenCalledWith("PUT", "/applications/app1/commands", commands);
  });

  it("should_call_PUT_guild_commands_when_guild_id_provided", async () => {
    const handler = registeredTools.get("bulk_overwrite_commands")!;
    const commands = [{ name: "ping", description: "Pong!" }];
    await handler({ application_id: "app1", guild_id: "g1", commands });
    expect(callApiSpy).toHaveBeenCalledWith("PUT", "/applications/app1/guilds/g1/commands", commands);
  });
});

describe("error handling", () => {
  it("should_return_error_result_when_discord_api_error", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordError(400, 50035, "Invalid Form Body"));
    const handler = registeredTools.get("create_command")!;
    const result = await handler({ application_id: "app1", name: "", description: "" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Discord error 400");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordRateLimitError(60, true));
    const handler = registeredTools.get("bulk_overwrite_commands")!;
    const result = await handler({ application_id: "app1", commands: [] });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("global");
  });
});
