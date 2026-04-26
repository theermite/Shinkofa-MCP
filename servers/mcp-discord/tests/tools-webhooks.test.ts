import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiscordClient, DiscordError, DiscordRateLimitError } from "../src/lib/client.js";
import { registerWebhookTools } from "../src/tools/webhooks.js";

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

  registerWebhookTools(server, client);
});

describe("create_webhook", () => {
  it("should_call_POST_channel_webhooks_with_body_and_reason_when_creating", async () => {
    const handler = registeredTools.get("create_webhook")!;
    await handler({ channel_id: "ch1", name: "My Hook", reason: "automation" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/channels/ch1/webhooks",
      { name: "My Hook" },
      undefined,
      "automation",
    );
  });
});

describe("get_webhook", () => {
  it("should_call_GET_webhook_by_id_when_fetching", async () => {
    const handler = registeredTools.get("get_webhook")!;
    await handler({ webhook_id: "wh1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/webhooks/wh1");
  });
});

describe("get_channel_webhooks", () => {
  it("should_call_GET_channel_webhooks_when_listing", async () => {
    const handler = registeredTools.get("get_channel_webhooks")!;
    await handler({ channel_id: "ch1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/channels/ch1/webhooks");
  });
});

describe("get_guild_webhooks", () => {
  it("should_call_GET_guild_webhooks_when_listing", async () => {
    const handler = registeredTools.get("get_guild_webhooks")!;
    await handler({ guild_id: "g1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/webhooks");
  });
});

describe("modify_webhook", () => {
  it("should_call_PATCH_webhook_with_body_and_reason_when_modifying", async () => {
    const handler = registeredTools.get("modify_webhook")!;
    await handler({ webhook_id: "wh1", name: "Updated", reason: "rename" });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/webhooks/wh1", { name: "Updated" }, undefined, "rename");
  });
});

describe("delete_webhook", () => {
  it("should_call_DELETE_webhook_with_reason_when_deleting", async () => {
    const handler = registeredTools.get("delete_webhook")!;
    await handler({ webhook_id: "wh1", reason: "cleanup" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/webhooks/wh1", undefined, undefined, "cleanup");
  });
});

describe("execute_webhook", () => {
  it("should_call_POST_webhook_with_token_body_and_query_when_executing", async () => {
    const handler = registeredTools.get("execute_webhook")!;
    await handler({ webhook_id: "wh1", webhook_token: "tok1", content: "Hello", wait: true });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/webhooks/wh1/tok1", { content: "Hello" }, { wait: true });
  });

  it("should_include_thread_id_in_query_when_provided", async () => {
    const handler = registeredTools.get("execute_webhook")!;
    await handler({ webhook_id: "wh1", webhook_token: "tok1", content: "Hi", thread_id: "t1" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/webhooks/wh1/tok1", { content: "Hi" }, { thread_id: "t1" });
  });
});

describe("get_webhook_message", () => {
  it("should_call_GET_webhook_message_when_fetching", async () => {
    const handler = registeredTools.get("get_webhook_message")!;
    await handler({ webhook_id: "wh1", webhook_token: "tok1", message_id: "msg1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/webhooks/wh1/tok1/messages/msg1", undefined, {});
  });

  it("should_include_thread_id_query_when_provided", async () => {
    const handler = registeredTools.get("get_webhook_message")!;
    await handler({ webhook_id: "wh1", webhook_token: "tok1", message_id: "msg1", thread_id: "t1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/webhooks/wh1/tok1/messages/msg1", undefined, { thread_id: "t1" });
  });
});

describe("edit_webhook_message", () => {
  it("should_call_PATCH_webhook_message_with_body_when_editing", async () => {
    const handler = registeredTools.get("edit_webhook_message")!;
    await handler({ webhook_id: "wh1", webhook_token: "tok1", message_id: "msg1", content: "Updated" });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/webhooks/wh1/tok1/messages/msg1", { content: "Updated" }, {});
  });
});

describe("delete_webhook_message", () => {
  it("should_call_DELETE_webhook_message_when_deleting", async () => {
    const handler = registeredTools.get("delete_webhook_message")!;
    await handler({ webhook_id: "wh1", webhook_token: "tok1", message_id: "msg1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/webhooks/wh1/tok1/messages/msg1", undefined, {});
  });
});

describe("error handling", () => {
  it("should_return_error_result_when_discord_api_error", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordError(404, 10015, "Unknown Webhook"));
    const handler = registeredTools.get("get_webhook")!;
    const result = await handler({ webhook_id: "invalid" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unknown Webhook");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordRateLimitError(1, false));
    const handler = registeredTools.get("execute_webhook")!;
    const result = await handler({ webhook_id: "wh1", webhook_token: "tok1", content: "test" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("rate limit");
  });

  it("should_return_network_error_when_fetch_fails", async () => {
    callApiSpy.mockRejectedValueOnce(new TypeError("fetch failed"));
    const handler = registeredTools.get("create_webhook")!;
    const result = await handler({ channel_id: "ch1", name: "test" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network error");
  });
});
