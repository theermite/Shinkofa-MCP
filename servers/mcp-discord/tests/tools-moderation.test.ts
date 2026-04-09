import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient, DiscordError, DiscordRateLimitError } from "../src/lib/client.js";
import { registerModerationTools } from "../src/tools/moderation.js";

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

  registerModerationTools(server, client);
});

describe("list_automod_rules", () => {
  it("should_call_GET_automod_rules_when_listing", async () => {
    const handler = registeredTools.get("list_automod_rules")!;
    await handler({ guild_id: "g1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/auto-moderation/rules");
  });
});

describe("get_automod_rule", () => {
  it("should_call_GET_automod_rule_by_id_when_fetching", async () => {
    const handler = registeredTools.get("get_automod_rule")!;
    await handler({ guild_id: "g1", rule_id: "r1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/auto-moderation/rules/r1");
  });
});

describe("create_automod_rule", () => {
  it("should_call_POST_automod_rules_with_body_and_reason_when_creating", async () => {
    const handler = registeredTools.get("create_automod_rule")!;
    await handler({ guild_id: "g1", name: "No spam", event_type: 1, trigger_type: 1, actions: [], reason: "safety" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/guilds/g1/auto-moderation/rules",
      { name: "No spam", event_type: 1, trigger_type: 1, actions: [] },
      undefined,
      "safety",
    );
  });
});

describe("modify_automod_rule", () => {
  it("should_call_PATCH_automod_rule_with_body_and_reason_when_modifying", async () => {
    const handler = registeredTools.get("modify_automod_rule")!;
    await handler({ guild_id: "g1", rule_id: "r1", name: "Updated Rule", reason: "adjust" });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/guilds/g1/auto-moderation/rules/r1", { name: "Updated Rule" }, undefined, "adjust");
  });
});

describe("delete_automod_rule", () => {
  it("should_call_DELETE_automod_rule_with_reason_when_deleting", async () => {
    const handler = registeredTools.get("delete_automod_rule")!;
    await handler({ guild_id: "g1", rule_id: "r1", reason: "obsolete" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/guilds/g1/auto-moderation/rules/r1", undefined, undefined, "obsolete");
  });
});

describe("error handling", () => {
  it("should_return_error_result_when_discord_api_error", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordError(403, 50013, "Missing Permissions"));
    const handler = registeredTools.get("create_automod_rule")!;
    const result = await handler({ guild_id: "g1", name: "x", event_type: 1, trigger_type: 1, actions: [] });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Missing Permissions");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordRateLimitError(10, true));
    const handler = registeredTools.get("list_automod_rules")!;
    const result = await handler({ guild_id: "g1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("global");
  });

  it("should_return_timeout_error_when_request_aborted", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    callApiSpy.mockRejectedValueOnce(abortError);
    const handler = registeredTools.get("get_automod_rule")!;
    const result = await handler({ guild_id: "g1", rule_id: "r1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("timed out");
  });
});
