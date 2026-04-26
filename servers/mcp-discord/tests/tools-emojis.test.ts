import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiscordClient, DiscordError, DiscordRateLimitError } from "../src/lib/client.js";
import { registerEmojiTools } from "../src/tools/emojis.js";

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

  registerEmojiTools(server, client);
});

describe("list_emojis", () => {
  it("should_call_GET_guild_emojis_when_listing", async () => {
    const handler = registeredTools.get("list_emojis")!;
    await handler({ guild_id: "g1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/emojis");
  });
});

describe("get_emoji", () => {
  it("should_call_GET_guild_emoji_by_id_when_fetching", async () => {
    const handler = registeredTools.get("get_emoji")!;
    await handler({ guild_id: "g1", emoji_id: "e1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/emojis/e1");
  });
});

describe("create_emoji", () => {
  it("should_call_POST_guild_emojis_with_body_and_reason_when_creating", async () => {
    const handler = registeredTools.get("create_emoji")!;
    await handler({ guild_id: "g1", name: "pepe", image: "data:image/png;base64,abc", reason: "fun" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/guilds/g1/emojis",
      { name: "pepe", image: "data:image/png;base64,abc" },
      undefined,
      "fun",
    );
  });
});

describe("modify_emoji", () => {
  it("should_call_PATCH_guild_emoji_with_body_and_reason_when_modifying", async () => {
    const handler = registeredTools.get("modify_emoji")!;
    await handler({ guild_id: "g1", emoji_id: "e1", name: "kappa", reason: "rename" });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/guilds/g1/emojis/e1", { name: "kappa" }, undefined, "rename");
  });
});

describe("delete_emoji", () => {
  it("should_call_DELETE_guild_emoji_with_reason_when_deleting", async () => {
    const handler = registeredTools.get("delete_emoji")!;
    await handler({ guild_id: "g1", emoji_id: "e1", reason: "cleanup" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/guilds/g1/emojis/e1", undefined, undefined, "cleanup");
  });
});

describe("error handling", () => {
  it("should_return_error_result_when_discord_api_error", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordError(403, 50013, "Missing Permissions"));
    const handler = registeredTools.get("create_emoji")!;
    const result = await handler({ guild_id: "g1", name: "x", image: "x" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Discord error 403");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordRateLimitError(30, false));
    const handler = registeredTools.get("list_emojis")!;
    const result = await handler({ guild_id: "g1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("retry after 30s");
  });
});
