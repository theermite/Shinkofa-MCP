import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TelegramClient, TelegramError } from "../src/lib/client.js";
import { registerChatTools } from "../src/tools/chat.js";

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

  registerChatTools(server, client);
});

describe("Chat tools — info", () => {
  it("should_get_chat", async () => {
    const cb = registeredTools.get("get_chat")!;
    await cb({ chat_id: 123 });
    expect(callApiSpy).toHaveBeenCalledWith("getChat", { chat_id: 123 });
  });

  it("should_get_chat_member", async () => {
    const cb = registeredTools.get("get_chat_member")!;
    await cb({ chat_id: 123, user_id: 456 });
    expect(callApiSpy).toHaveBeenCalledWith("getChatMember", { chat_id: 123, user_id: 456 });
  });

  it("should_get_chat_member_count", async () => {
    const cb = registeredTools.get("get_chat_member_count")!;
    await cb({ chat_id: 123 });
    expect(callApiSpy).toHaveBeenCalledWith("getChatMembersCount", { chat_id: 123 });
  });

  it("should_get_chat_administrators", async () => {
    const cb = registeredTools.get("get_chat_administrators")!;
    await cb({ chat_id: 123 });
    expect(callApiSpy).toHaveBeenCalledWith("getChatAdministrators", { chat_id: 123 });
  });
});

describe("Chat tools — settings", () => {
  it("should_set_chat_title", async () => {
    const cb = registeredTools.get("set_chat_title")!;
    await cb({ chat_id: 123, title: "New Title" });
    expect(callApiSpy).toHaveBeenCalledWith("setChatTitle", { chat_id: 123, title: "New Title" });
  });

  it("should_set_chat_description", async () => {
    const cb = registeredTools.get("set_chat_description")!;
    await cb({ chat_id: 123, description: "New desc" });
    expect(callApiSpy).toHaveBeenCalledWith("setChatDescription", { chat_id: 123, description: "New desc" });
  });

  it("should_set_chat_permissions", async () => {
    const cb = registeredTools.get("set_chat_permissions")!;
    const perms = { can_send_messages: true };
    await cb({ chat_id: 123, permissions: perms });
    expect(callApiSpy).toHaveBeenCalledWith("setChatPermissions", { chat_id: 123, permissions: perms });
  });
});

describe("Chat tools — moderation", () => {
  it("should_ban_chat_member", async () => {
    const cb = registeredTools.get("ban_chat_member")!;
    await cb({ chat_id: 123, user_id: 456 });
    expect(callApiSpy).toHaveBeenCalledWith("banChatMember", { chat_id: 123, user_id: 456 });
  });

  it("should_unban_chat_member", async () => {
    const cb = registeredTools.get("unban_chat_member")!;
    await cb({ chat_id: 123, user_id: 456 });
    expect(callApiSpy).toHaveBeenCalledWith("unbanChatMember", { chat_id: 123, user_id: 456 });
  });

  it("should_restrict_chat_member", async () => {
    const cb = registeredTools.get("restrict_chat_member")!;
    const perms = { can_send_messages: false };
    await cb({ chat_id: 123, user_id: 456, permissions: perms });
    expect(callApiSpy).toHaveBeenCalledWith("restrictChatMember", { chat_id: 123, user_id: 456, permissions: perms });
  });

  it("should_promote_chat_member", async () => {
    const cb = registeredTools.get("promote_chat_member")!;
    await cb({ chat_id: 123, user_id: 456, can_manage_chat: true });
    expect(callApiSpy).toHaveBeenCalledWith("promoteChatMember", { chat_id: 123, user_id: 456, can_manage_chat: true });
  });
});

describe("Chat tools — invite links", () => {
  it("should_create_invite_link", async () => {
    const cb = registeredTools.get("create_invite_link")!;
    await cb({ chat_id: 123 });
    expect(callApiSpy).toHaveBeenCalledWith("createChatInviteLink", { chat_id: 123 });
  });

  it("should_export_invite_link", async () => {
    const cb = registeredTools.get("export_invite_link")!;
    await cb({ chat_id: 123 });
    expect(callApiSpy).toHaveBeenCalledWith("exportChatInviteLink", { chat_id: 123 });
  });
});

describe("Chat tools — forum topics", () => {
  it("should_create_forum_topic", async () => {
    const cb = registeredTools.get("create_forum_topic")!;
    await cb({ chat_id: 123, name: "General" });
    expect(callApiSpy).toHaveBeenCalledWith("createForumTopic", { chat_id: 123, name: "General" });
  });

  it("should_edit_forum_topic", async () => {
    const cb = registeredTools.get("edit_forum_topic")!;
    await cb({ chat_id: 123, message_thread_id: 1, name: "Updated" });
    expect(callApiSpy).toHaveBeenCalledWith("editForumTopic", { chat_id: 123, message_thread_id: 1, name: "Updated" });
  });

  it("should_close_forum_topic", async () => {
    const cb = registeredTools.get("close_forum_topic")!;
    await cb({ chat_id: 123, message_thread_id: 1 });
    expect(callApiSpy).toHaveBeenCalledWith("closeForumTopic", { chat_id: 123, message_thread_id: 1 });
  });

  it("should_reopen_forum_topic", async () => {
    const cb = registeredTools.get("reopen_forum_topic")!;
    await cb({ chat_id: 123, message_thread_id: 1 });
    expect(callApiSpy).toHaveBeenCalledWith("reopenForumTopic", { chat_id: 123, message_thread_id: 1 });
  });

  it("should_delete_forum_topic", async () => {
    const cb = registeredTools.get("delete_forum_topic")!;
    await cb({ chat_id: 123, message_thread_id: 1 });
    expect(callApiSpy).toHaveBeenCalledWith("deleteForumTopic", { chat_id: 123, message_thread_id: 1 });
  });
});

describe("Chat tools — error handling", () => {
  it("should_handle_TelegramError", async () => {
    callApiSpy.mockRejectedValue(new TelegramError(403, "Forbidden: bot was kicked"));
    const cb = registeredTools.get("get_chat")!;
    const result = await cb({ chat_id: 123 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("403");
  });

  it("should_handle_network_error", async () => {
    callApiSpy.mockRejectedValue(new TypeError("fetch failed"));
    const cb = registeredTools.get("ban_chat_member")!;
    const result = await cb({ chat_id: 123, user_id: 456 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network error");
  });
});
