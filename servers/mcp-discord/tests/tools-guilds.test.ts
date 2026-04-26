import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiscordClient, DiscordError, DiscordRateLimitError } from "../src/lib/client.js";
import { registerGuildTools } from "../src/tools/guilds.js";

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

  registerGuildTools(server, client);
});

describe("get_guild", () => {
  it("should_call_GET_guild_with_counts_when_fetching", async () => {
    const handler = registeredTools.get("get_guild")!;
    await handler({ guild_id: "g1", with_counts: true });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1", undefined, { with_counts: true });
  });
});

describe("modify_guild", () => {
  it("should_call_PATCH_guild_with_body_and_reason_when_modifying", async () => {
    const handler = registeredTools.get("modify_guild")!;
    await handler({ guild_id: "g1", name: "New Name", reason: "rebrand" });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/guilds/g1", { name: "New Name" }, undefined, "rebrand");
  });
});

describe("get_guild_channels", () => {
  it("should_call_GET_guild_channels_when_listing", async () => {
    const handler = registeredTools.get("get_guild_channels")!;
    await handler({ guild_id: "g1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/channels");
  });
});

describe("create_guild_channel", () => {
  it("should_call_POST_guild_channels_with_body_when_creating", async () => {
    const handler = registeredTools.get("create_guild_channel")!;
    await handler({ guild_id: "g1", name: "general", type: 0, reason: "setup" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/guilds/g1/channels",
      { name: "general", type: 0 },
      undefined,
      "setup",
    );
  });
});

describe("modify_channel_positions", () => {
  it("should_call_PATCH_guild_channels_with_positions_when_reordering", async () => {
    const handler = registeredTools.get("modify_channel_positions")!;
    const channels = [{ id: "ch1", position: 0 }];
    await handler({ guild_id: "g1", channels });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/guilds/g1/channels", { channels });
  });
});

describe("get_active_threads", () => {
  it("should_call_GET_active_threads_when_listing", async () => {
    const handler = registeredTools.get("get_active_threads")!;
    await handler({ guild_id: "g1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/threads/active");
  });
});

describe("get_welcome_screen", () => {
  it("should_call_GET_welcome_screen_when_fetching", async () => {
    const handler = registeredTools.get("get_welcome_screen")!;
    await handler({ guild_id: "g1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/welcome-screen");
  });
});

describe("modify_welcome_screen", () => {
  it("should_call_PATCH_welcome_screen_with_body_when_modifying", async () => {
    const handler = registeredTools.get("modify_welcome_screen")!;
    await handler({ guild_id: "g1", enabled: true, description: "Welcome!", reason: "update" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "PATCH",
      "/guilds/g1/welcome-screen",
      { enabled: true, description: "Welcome!" },
      undefined,
      "update",
    );
  });
});

describe("get_onboarding", () => {
  it("should_call_GET_onboarding_when_fetching", async () => {
    const handler = registeredTools.get("get_onboarding")!;
    await handler({ guild_id: "g1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/onboarding");
  });
});

describe("modify_onboarding", () => {
  it("should_call_PUT_onboarding_with_body_when_modifying", async () => {
    const handler = registeredTools.get("modify_onboarding")!;
    await handler({ guild_id: "g1", prompts: [], default_channel_ids: ["ch1"], enabled: true, reason: "setup" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "PUT",
      "/guilds/g1/onboarding",
      { prompts: [], default_channel_ids: ["ch1"], enabled: true },
      undefined,
      "setup",
    );
  });
});

describe("get_widget_settings", () => {
  it("should_call_GET_widget_when_fetching", async () => {
    const handler = registeredTools.get("get_widget_settings")!;
    await handler({ guild_id: "g1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/widget");
  });
});

describe("modify_widget", () => {
  it("should_call_PATCH_widget_with_body_when_modifying", async () => {
    const handler = registeredTools.get("modify_widget")!;
    await handler({ guild_id: "g1", enabled: false, reason: "disable" });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/guilds/g1/widget", { enabled: false }, undefined, "disable");
  });
});

describe("get_vanity_url", () => {
  it("should_call_GET_vanity_url_when_fetching", async () => {
    const handler = registeredTools.get("get_vanity_url")!;
    await handler({ guild_id: "g1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/vanity-url");
  });
});

describe("get_prune_count", () => {
  it("should_call_GET_prune_with_query_when_counting", async () => {
    const handler = registeredTools.get("get_prune_count")!;
    await handler({ guild_id: "g1", days: 7 });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/prune", undefined, { days: 7 });
  });
});

describe("begin_prune", () => {
  it("should_call_POST_prune_with_body_and_reason_when_pruning", async () => {
    const handler = registeredTools.get("begin_prune")!;
    await handler({ guild_id: "g1", days: 30, compute_prune_count: true, reason: "cleanup" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/guilds/g1/prune",
      { days: 30, compute_prune_count: true },
      undefined,
      "cleanup",
    );
  });
});

describe("get_audit_log", () => {
  it("should_call_GET_audit_logs_with_query_when_fetching", async () => {
    const handler = registeredTools.get("get_audit_log")!;
    await handler({ guild_id: "g1", limit: 50 });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/audit-logs", undefined, { limit: 50 });
  });
});

describe("error handling", () => {
  it("should_return_error_result_when_discord_api_error", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordError(403, 50013, "Missing Permissions"));
    const handler = registeredTools.get("get_guild")!;
    const result = await handler({ guild_id: "g1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Discord error 403");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordRateLimitError(10, false));
    const handler = registeredTools.get("modify_guild")!;
    const result = await handler({ guild_id: "g1", name: "test" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("retry after 10s");
  });
});
