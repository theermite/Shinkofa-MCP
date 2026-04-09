import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient, DiscordError, DiscordRateLimitError } from "../src/lib/client.js";
import { registerUserTools } from "../src/tools/users.js";

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

  registerUserTools(server, client);
});

describe("get_current_user", () => {
  it("should_call_GET_users_me_when_fetching_current_user", async () => {
    const handler = registeredTools.get("get_current_user")!;
    await handler({});
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/users/@me");
  });
});

describe("get_user", () => {
  it("should_call_GET_users_with_id_when_fetching_user", async () => {
    const handler = registeredTools.get("get_user")!;
    await handler({ user_id: "u1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/users/u1");
  });
});

describe("get_current_user_guilds", () => {
  it("should_call_GET_users_me_guilds_when_listing_bot_guilds", async () => {
    const handler = registeredTools.get("get_current_user_guilds")!;
    await handler({});
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/users/@me/guilds");
  });
});

describe("create_dm", () => {
  it("should_call_POST_users_me_channels_with_recipient_when_creating_dm", async () => {
    const handler = registeredTools.get("create_dm")!;
    await handler({ recipient_id: "u1" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/users/@me/channels", { recipient_id: "u1" });
  });
});

describe("error handling", () => {
  it("should_return_error_result_when_discord_api_error", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordError(401, 0, "401: Unauthorized"));
    const handler = registeredTools.get("get_current_user")!;
    const result = await handler({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unauthorized");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordRateLimitError(5, false));
    const handler = registeredTools.get("get_user")!;
    const result = await handler({ user_id: "u1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("rate limit");
  });
});
