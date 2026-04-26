import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { YouTubeClient, YouTubeError } from "../src/lib/client.js";
import { registerLiveTools } from "../src/tools/live.js";

let server: McpServer;
let client: YouTubeClient;
let callApiSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: any[]) => any>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new YouTubeClient({ apiKey: "test_key" });
  callApiSpy = vi.spyOn(client, "callApi").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as any);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerLiveTools(server, client);
});

describe("Broadcast tools — callbacks", () => {
  it("should_list_broadcasts", async () => {
    const cb = registeredTools.get("list_broadcasts")!;
    await cb({ part: "snippet", mine: true });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/liveBroadcasts", undefined, { part: "snippet", mine: true });
  });

  it("should_create_broadcast_with_default_part", async () => {
    const cb = registeredTools.get("create_broadcast")!;
    await cb({ snippet: { title: "Live!", scheduledStartTime: "2026-01-01T00:00:00Z" } });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/liveBroadcasts",
      { snippet: { title: "Live!", scheduledStartTime: "2026-01-01T00:00:00Z" } },
      { part: "snippet,status,contentDetails" },
    );
  });

  it("should_update_broadcast", async () => {
    const cb = registeredTools.get("update_broadcast")!;
    await cb({ id: "bc1", snippet: { title: "Updated" } });
    expect(callApiSpy).toHaveBeenCalledWith(
      "PUT",
      "/liveBroadcasts",
      { id: "bc1", snippet: { title: "Updated" } },
      { part: "snippet,status,contentDetails" },
    );
  });

  it("should_delete_broadcast", async () => {
    const cb = registeredTools.get("delete_broadcast")!;
    await cb({ id: "bc1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/liveBroadcasts", undefined, { id: "bc1" });
  });

  it("should_bind_broadcast", async () => {
    const cb = registeredTools.get("bind_broadcast")!;
    await cb({ id: "bc1", part: "id,contentDetails", streamId: "s1" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/liveBroadcasts/bind", undefined, {
      id: "bc1",
      part: "id,contentDetails",
      streamId: "s1",
    });
  });

  it("should_transition_broadcast", async () => {
    const cb = registeredTools.get("transition_broadcast")!;
    await cb({ id: "bc1", broadcastStatus: "live", part: "id,status" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/liveBroadcasts/transition", undefined, {
      id: "bc1",
      broadcastStatus: "live",
      part: "id,status",
    });
  });
});

describe("Stream tools — callbacks", () => {
  it("should_list_live_streams", async () => {
    const cb = registeredTools.get("list_live_streams")!;
    await cb({ part: "snippet", mine: true });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/liveStreams", undefined, { part: "snippet", mine: true });
  });

  it("should_create_live_stream_with_default_part", async () => {
    const cb = registeredTools.get("create_live_stream")!;
    await cb({ snippet: { title: "My Stream" } });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/liveStreams",
      { snippet: { title: "My Stream" } },
      { part: "snippet,cdn" },
    );
  });

  it("should_update_live_stream", async () => {
    const cb = registeredTools.get("update_live_stream")!;
    await cb({ id: "s1", snippet: { title: "Updated" } });
    expect(callApiSpy).toHaveBeenCalledWith(
      "PUT",
      "/liveStreams",
      { id: "s1", snippet: { title: "Updated" } },
      { part: "snippet,cdn" },
    );
  });

  it("should_delete_live_stream", async () => {
    const cb = registeredTools.get("delete_live_stream")!;
    await cb({ id: "s1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/liveStreams", undefined, { id: "s1" });
  });
});

describe("Chat tools — callbacks", () => {
  it("should_list_live_chat_messages", async () => {
    const cb = registeredTools.get("list_live_chat_messages")!;
    await cb({ part: "snippet", liveChatId: "lc1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/liveChat/messages", undefined, {
      part: "snippet",
      liveChatId: "lc1",
    });
  });

  it("should_send_live_chat_message_with_default_type", async () => {
    const cb = registeredTools.get("send_live_chat_message")!;
    await cb({ liveChatId: "lc1", messageText: "Hello!" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/liveChat/messages",
      { snippet: { liveChatId: "lc1", type: "textMessageEvent", textMessageDetails: { messageText: "Hello!" } } },
      { part: "snippet" },
    );
  });

  it("should_delete_live_chat_message", async () => {
    const cb = registeredTools.get("delete_live_chat_message")!;
    await cb({ id: "msg1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/liveChat/messages", undefined, { id: "msg1" });
  });
});

describe("Moderator tools — callbacks", () => {
  it("should_list_live_chat_moderators", async () => {
    const cb = registeredTools.get("list_live_chat_moderators")!;
    await cb({ part: "snippet", liveChatId: "lc1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/liveChat/moderators", undefined, {
      part: "snippet",
      liveChatId: "lc1",
    });
  });

  it("should_add_live_chat_moderator", async () => {
    const cb = registeredTools.get("add_live_chat_moderator")!;
    await cb({ liveChatId: "lc1", channelId: "ch1" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/liveChat/moderators",
      { snippet: { liveChatId: "lc1", moderatorDetails: { channelId: "ch1" } } },
      { part: "snippet" },
    );
  });

  it("should_remove_live_chat_moderator", async () => {
    const cb = registeredTools.get("remove_live_chat_moderator")!;
    await cb({ id: "mod1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/liveChat/moderators", undefined, { id: "mod1" });
  });
});

describe("Ban tools — callbacks", () => {
  it("should_ban_live_chat_user", async () => {
    const cb = registeredTools.get("ban_live_chat_user")!;
    await cb({ liveChatId: "lc1", channelId: "ch1", type: "permanent" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/liveChat/bans",
      {
        snippet: {
          liveChatId: "lc1",
          type: "permanent",
          banDurationSeconds: undefined,
          bannedUserDetails: { channelId: "ch1" },
        },
      },
      { part: "snippet" },
    );
  });

  it("should_unban_live_chat_user", async () => {
    const cb = registeredTools.get("unban_live_chat_user")!;
    await cb({ id: "ban1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/liveChat/bans", undefined, { id: "ban1" });
  });
});

describe("Live tools — error handling", () => {
  it("should_return_toolError_on_YouTubeError", async () => {
    callApiSpy.mockRejectedValueOnce(new YouTubeError(403, "liveStreamingNotEnabled"));
    const cb = registeredTools.get("list_broadcasts")!;
    const result = await cb({ part: "snippet" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("liveStreamingNotEnabled");
  });

  it("should_return_toolError_on_TypeError", async () => {
    callApiSpy.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const cb = registeredTools.get("create_live_stream")!;
    const result = await cb({ snippet: { title: "T" } });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network error");
  });

  it("should_rethrow_unknown_errors", async () => {
    callApiSpy.mockRejectedValueOnce(null);
    const cb = registeredTools.get("send_live_chat_message")!;
    await expect(cb({ liveChatId: "lc1", messageText: "Hi" })).rejects.toBeNull();
  });
});
