import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TelegramClient, TelegramError } from "../src/lib/client.js";
import { registerBotTools } from "../src/tools/bot.js";

let server: McpServer;
let client: TelegramClient;
let callApiSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: any[]) => any>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new TelegramClient({ botToken: "123:ABC" });
  callApiSpy = vi.spyOn(client, "callApi").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as any);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerBotTools(server, client);
});

describe("Bot tools", () => {
  it("should_get_me", async () => {
    const cb = registeredTools.get("get_me")!;
    await cb({});
    expect(callApiSpy).toHaveBeenCalledWith("getMe");
  });

  it("should_set_my_commands", async () => {
    const commands = [{ command: "start", description: "Start the bot" }];
    const cb = registeredTools.get("set_my_commands")!;
    await cb({ commands });
    expect(callApiSpy).toHaveBeenCalledWith("setMyCommands", { commands });
  });

  it("should_get_my_commands", async () => {
    const cb = registeredTools.get("get_my_commands")!;
    await cb({});
    expect(callApiSpy).toHaveBeenCalledWith("getMyCommands", {});
  });

  it("should_delete_my_commands", async () => {
    const cb = registeredTools.get("delete_my_commands")!;
    await cb({});
    expect(callApiSpy).toHaveBeenCalledWith("deleteMyCommands", {});
  });

  it("should_set_webhook", async () => {
    const cb = registeredTools.get("set_webhook")!;
    await cb({ url: "https://example.com/webhook" });
    expect(callApiSpy).toHaveBeenCalledWith("setWebhook", { url: "https://example.com/webhook" });
  });

  it("should_delete_webhook", async () => {
    const cb = registeredTools.get("delete_webhook")!;
    await cb({ drop_pending_updates: true });
    expect(callApiSpy).toHaveBeenCalledWith("deleteWebhook", { drop_pending_updates: true });
  });

  it("should_get_webhook_info", async () => {
    const cb = registeredTools.get("get_webhook_info")!;
    await cb({});
    expect(callApiSpy).toHaveBeenCalledWith("getWebhookInfo");
  });

  it("should_get_updates", async () => {
    const cb = registeredTools.get("get_updates")!;
    await cb({ limit: 10 });
    expect(callApiSpy).toHaveBeenCalledWith("getUpdates", { limit: 10 });
  });

  it("should_send_invoice", async () => {
    const cb = registeredTools.get("send_invoice")!;
    const params = { chat_id: 123, title: "Premium", description: "Sub", payload: "p", currency: "EUR", prices: [{ label: "M", amount: 999 }] };
    await cb(params);
    expect(callApiSpy).toHaveBeenCalledWith("sendInvoice", params);
  });

  it("should_get_star_transactions", async () => {
    const cb = registeredTools.get("get_star_transactions")!;
    await cb({ limit: 5 });
    expect(callApiSpy).toHaveBeenCalledWith("getStarTransactions", { limit: 5 });
  });
});

describe("Bot tools — error handling", () => {
  it("should_handle_TelegramError", async () => {
    callApiSpy.mockRejectedValue(new TelegramError(401, "Unauthorized"));
    const cb = registeredTools.get("get_me")!;
    const result = await cb({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("401");
  });

  it("should_handle_timeout", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    callApiSpy.mockRejectedValue(err);
    const cb = registeredTools.get("get_updates")!;
    const result = await cb({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Request timed out");
  });
});
