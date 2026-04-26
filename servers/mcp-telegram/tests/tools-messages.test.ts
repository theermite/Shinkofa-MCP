import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TelegramClient, TelegramError } from "../src/lib/client.js";
import { registerMessageTools } from "../src/tools/messages.js";

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

  registerMessageTools(server, client);
});

describe("Message tools", () => {
  it("should_send_message", async () => {
    const cb = registeredTools.get("send_message")!;
    await cb({ chat_id: 123, text: "Hello" });
    expect(callApiSpy).toHaveBeenCalledWith("sendMessage", { chat_id: 123, text: "Hello" });
  });

  it("should_edit_message_text", async () => {
    const cb = registeredTools.get("edit_message_text")!;
    await cb({ chat_id: 123, message_id: 1, text: "Edited" });
    expect(callApiSpy).toHaveBeenCalledWith("editMessageText", { chat_id: 123, message_id: 1, text: "Edited" });
  });

  it("should_delete_message", async () => {
    const cb = registeredTools.get("delete_message")!;
    await cb({ chat_id: 123, message_id: 1 });
    expect(callApiSpy).toHaveBeenCalledWith("deleteMessage", { chat_id: 123, message_id: 1 });
  });

  it("should_delete_messages", async () => {
    const cb = registeredTools.get("delete_messages")!;
    await cb({ chat_id: 123, message_ids: [1, 2, 3] });
    expect(callApiSpy).toHaveBeenCalledWith("deleteMessages", { chat_id: 123, message_ids: [1, 2, 3] });
  });

  it("should_forward_message", async () => {
    const cb = registeredTools.get("forward_message")!;
    await cb({ chat_id: 456, from_chat_id: 123, message_id: 1 });
    expect(callApiSpy).toHaveBeenCalledWith("forwardMessage", { chat_id: 456, from_chat_id: 123, message_id: 1 });
  });

  it("should_copy_message", async () => {
    const cb = registeredTools.get("copy_message")!;
    await cb({ chat_id: 456, from_chat_id: 123, message_id: 1 });
    expect(callApiSpy).toHaveBeenCalledWith("copyMessage", { chat_id: 456, from_chat_id: 123, message_id: 1 });
  });

  it("should_pin_message", async () => {
    const cb = registeredTools.get("pin_message")!;
    await cb({ chat_id: 123, message_id: 1 });
    expect(callApiSpy).toHaveBeenCalledWith("pinChatMessage", { chat_id: 123, message_id: 1 });
  });

  it("should_unpin_message", async () => {
    const cb = registeredTools.get("unpin_message")!;
    await cb({ chat_id: 123 });
    expect(callApiSpy).toHaveBeenCalledWith("unpinChatMessage", { chat_id: 123 });
  });

  it("should_set_reaction", async () => {
    const cb = registeredTools.get("set_reaction")!;
    await cb({ chat_id: 123, message_id: 1, reaction: [{ type: "emoji", emoji: "👍" }] });
    expect(callApiSpy).toHaveBeenCalledWith("setMessageReaction", {
      chat_id: 123,
      message_id: 1,
      reaction: [{ type: "emoji", emoji: "👍" }],
    });
  });
});

describe("Message tools — error handling", () => {
  it("should_handle_TelegramError", async () => {
    callApiSpy.mockRejectedValue(new TelegramError(400, "Bad Request"));
    const cb = registeredTools.get("send_message")!;
    const result = await cb({ chat_id: 123, text: "Hi" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("400");
  });

  it("should_handle_timeout", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    callApiSpy.mockRejectedValue(err);
    const cb = registeredTools.get("send_message")!;
    const result = await cb({ chat_id: 123, text: "Hi" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Request timed out");
  });

  it("should_handle_network_error", async () => {
    callApiSpy.mockRejectedValue(new TypeError("fetch failed"));
    const cb = registeredTools.get("edit_message_text")!;
    const result = await cb({ chat_id: 123, message_id: 1, text: "Hi" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network error");
  });
});
