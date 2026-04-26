import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiscordClient, DiscordError, DiscordRateLimitError } from "../src/lib/client.js";
import { registerEventTools } from "../src/tools/events.js";

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

  registerEventTools(server, client);
});

describe("list_scheduled_events", () => {
  it("should_call_GET_scheduled_events_with_user_count_when_listing", async () => {
    const handler = registeredTools.get("list_scheduled_events")!;
    await handler({ guild_id: "g1", with_user_count: true });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/scheduled-events", undefined, { with_user_count: true });
  });
});

describe("create_scheduled_event", () => {
  it("should_call_POST_scheduled_events_with_body_and_reason_when_creating", async () => {
    const handler = registeredTools.get("create_scheduled_event")!;
    await handler({
      guild_id: "g1",
      name: "Game Night",
      privacy_level: 2,
      scheduled_start_time: "2026-04-10T20:00:00Z",
      entity_type: 3,
      reason: "weekly event",
    });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/guilds/g1/scheduled-events",
      { name: "Game Night", privacy_level: 2, scheduled_start_time: "2026-04-10T20:00:00Z", entity_type: 3 },
      undefined,
      "weekly event",
    );
  });
});

describe("get_scheduled_event", () => {
  it("should_call_GET_scheduled_event_with_id_when_fetching", async () => {
    const handler = registeredTools.get("get_scheduled_event")!;
    await handler({ guild_id: "g1", event_id: "ev1", with_user_count: false });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/scheduled-events/ev1", undefined, {
      with_user_count: false,
    });
  });
});

describe("modify_scheduled_event", () => {
  it("should_call_PATCH_scheduled_event_with_body_and_reason_when_modifying", async () => {
    const handler = registeredTools.get("modify_scheduled_event")!;
    await handler({ guild_id: "g1", event_id: "ev1", name: "Updated Event", reason: "reschedule" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "PATCH",
      "/guilds/g1/scheduled-events/ev1",
      { name: "Updated Event" },
      undefined,
      "reschedule",
    );
  });
});

describe("delete_scheduled_event", () => {
  it("should_call_DELETE_scheduled_event_when_deleting", async () => {
    const handler = registeredTools.get("delete_scheduled_event")!;
    await handler({ guild_id: "g1", event_id: "ev1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/guilds/g1/scheduled-events/ev1");
  });
});

describe("get_event_users", () => {
  it("should_call_GET_event_users_with_query_when_fetching", async () => {
    const handler = registeredTools.get("get_event_users")!;
    await handler({ guild_id: "g1", event_id: "ev1", limit: 50 });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/scheduled-events/ev1/users", undefined, { limit: 50 });
  });
});

describe("error handling", () => {
  it("should_return_error_result_when_discord_api_error", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordError(404, 10070, "Unknown Scheduled Event"));
    const handler = registeredTools.get("get_scheduled_event")!;
    const result = await handler({ guild_id: "g1", event_id: "bad" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unknown Scheduled Event");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordRateLimitError(5, false));
    const handler = registeredTools.get("create_scheduled_event")!;
    const result = await handler({
      guild_id: "g1",
      name: "x",
      privacy_level: 2,
      scheduled_start_time: "x",
      entity_type: 3,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("rate limit");
  });

  it("should_return_network_error_when_fetch_fails", async () => {
    callApiSpy.mockRejectedValueOnce(new TypeError("fetch failed"));
    const handler = registeredTools.get("list_scheduled_events")!;
    const result = await handler({ guild_id: "g1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network error");
  });
});
