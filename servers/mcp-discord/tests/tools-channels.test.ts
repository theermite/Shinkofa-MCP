import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiscordClient, DiscordError, DiscordRateLimitError } from "../src/lib/client.js";
import { registerChannelTools } from "../src/tools/channels.js";

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

  registerChannelTools(server, client);
});

describe("get_channel", () => {
  it("should_call_GET_channel_when_fetching_channel", async () => {
    const handler = registeredTools.get("get_channel")!;
    await handler({ channel_id: "ch1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/channels/ch1");
  });
});

describe("modify_channel", () => {
  it("should_call_PATCH_channel_with_body_and_reason_when_modifying", async () => {
    const handler = registeredTools.get("modify_channel")!;
    await handler({ channel_id: "ch1", name: "new-name", reason: "rename" });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/channels/ch1", { name: "new-name" }, undefined, "rename");
  });
});

describe("delete_channel", () => {
  it("should_call_DELETE_channel_when_deleting", async () => {
    const handler = registeredTools.get("delete_channel")!;
    await handler({ channel_id: "ch1", reason: "cleanup" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/channels/ch1", undefined, undefined, "cleanup");
  });
});

describe("edit_channel_permissions", () => {
  it("should_call_PUT_permissions_with_overwrite_id_when_editing", async () => {
    const handler = registeredTools.get("edit_channel_permissions")!;
    await handler({ channel_id: "ch1", overwrite_id: "ow1", type: 0, allow: "1024" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "PUT",
      "/channels/ch1/permissions/ow1",
      { type: 0, allow: "1024" },
      undefined,
      undefined,
    );
  });
});

describe("delete_channel_permissions", () => {
  it("should_call_DELETE_permissions_when_removing_overwrite", async () => {
    const handler = registeredTools.get("delete_channel_permissions")!;
    await handler({ channel_id: "ch1", overwrite_id: "ow1", reason: "reset" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/channels/ch1/permissions/ow1", undefined, undefined, "reset");
  });
});

describe("trigger_typing", () => {
  it("should_call_POST_typing_when_triggering", async () => {
    const handler = registeredTools.get("trigger_typing")!;
    await handler({ channel_id: "ch1" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/channels/ch1/typing");
  });
});

describe("create_invite", () => {
  it("should_call_POST_invites_with_body_when_creating", async () => {
    const handler = registeredTools.get("create_invite")!;
    await handler({ channel_id: "ch1", max_age: 3600, reason: "event" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/channels/ch1/invites", { max_age: 3600 }, undefined, "event");
  });
});

describe("get_channel_invites", () => {
  it("should_call_GET_invites_when_listing", async () => {
    const handler = registeredTools.get("get_channel_invites")!;
    await handler({ channel_id: "ch1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/channels/ch1/invites");
  });
});

describe("follow_announcement_channel", () => {
  it("should_call_POST_followers_with_webhook_channel_id", async () => {
    const handler = registeredTools.get("follow_announcement_channel")!;
    await handler({ channel_id: "ch1", webhook_channel_id: "ch2" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/channels/ch1/followers", { webhook_channel_id: "ch2" });
  });
});

describe("create_thread_from_message", () => {
  it("should_call_POST_message_threads_when_creating_thread", async () => {
    const handler = registeredTools.get("create_thread_from_message")!;
    await handler({ channel_id: "ch1", message_id: "msg1", name: "Discussion", reason: "topic" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/channels/ch1/messages/msg1/threads",
      { name: "Discussion" },
      undefined,
      "topic",
    );
  });
});

describe("create_thread", () => {
  it("should_call_POST_threads_when_creating_thread_without_message", async () => {
    const handler = registeredTools.get("create_thread")!;
    await handler({ channel_id: "ch1", name: "New Thread", type: 11, reason: "forum" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/channels/ch1/threads",
      { name: "New Thread", type: 11 },
      undefined,
      "forum",
    );
  });
});

describe("join_thread", () => {
  it("should_call_PUT_thread_members_me_when_joining", async () => {
    const handler = registeredTools.get("join_thread")!;
    await handler({ channel_id: "ch1" });
    expect(callApiSpy).toHaveBeenCalledWith("PUT", "/channels/ch1/thread-members/@me");
  });
});

describe("leave_thread", () => {
  it("should_call_DELETE_thread_members_me_when_leaving", async () => {
    const handler = registeredTools.get("leave_thread")!;
    await handler({ channel_id: "ch1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/channels/ch1/thread-members/@me");
  });
});

describe("add_thread_member", () => {
  it("should_call_PUT_thread_members_with_user_id_when_adding", async () => {
    const handler = registeredTools.get("add_thread_member")!;
    await handler({ channel_id: "ch1", user_id: "u1" });
    expect(callApiSpy).toHaveBeenCalledWith("PUT", "/channels/ch1/thread-members/u1");
  });
});

describe("remove_thread_member", () => {
  it("should_call_DELETE_thread_members_with_user_id_when_removing", async () => {
    const handler = registeredTools.get("remove_thread_member")!;
    await handler({ channel_id: "ch1", user_id: "u1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/channels/ch1/thread-members/u1");
  });
});

describe("list_thread_members", () => {
  it("should_call_GET_thread_members_with_query_when_listing", async () => {
    const handler = registeredTools.get("list_thread_members")!;
    await handler({ channel_id: "ch1", limit: 50 });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/channels/ch1/thread-members", undefined, { limit: 50 });
  });
});

describe("list_archived_threads", () => {
  it("should_call_GET_archived_threads_with_type_when_listing", async () => {
    const handler = registeredTools.get("list_archived_threads")!;
    await handler({ channel_id: "ch1", type: "public" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/channels/ch1/threads/archived/public", undefined, {});
  });
});

describe("error handling", () => {
  it("should_return_error_result_when_discord_api_error", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordError(404, 10003, "Unknown Channel"));
    const handler = registeredTools.get("get_channel")!;
    const result = await handler({ channel_id: "invalid" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Discord error 404");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordRateLimitError(2.5, true));
    const handler = registeredTools.get("modify_channel")!;
    const result = await handler({ channel_id: "ch1", name: "test" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("global");
  });

  it("should_return_network_error_when_fetch_fails", async () => {
    const netError = new TypeError("fetch failed");
    callApiSpy.mockRejectedValueOnce(netError);
    const handler = registeredTools.get("get_channel")!;
    const result = await handler({ channel_id: "ch1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network error");
  });
});
