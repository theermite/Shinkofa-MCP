import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiscordClient, DiscordError, DiscordRateLimitError } from "../src/lib/client.js";
import { registerMessageTools } from "../src/tools/messages.js";

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

  registerMessageTools(server, client);
});

describe("send_message", () => {
  it("should_call_POST_channels_messages_when_sending_message", async () => {
    const handler = registeredTools.get("send_message")!;
    await handler({ channel_id: "ch1", content: "Hello" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/channels/ch1/messages", { content: "Hello" });
  });
});

describe("get_messages", () => {
  it("should_call_GET_channels_messages_when_fetching_messages", async () => {
    const handler = registeredTools.get("get_messages")!;
    await handler({ channel_id: "ch1", limit: 10 });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/channels/ch1/messages", undefined, { limit: 10 });
  });
});

describe("get_message", () => {
  it("should_call_GET_with_channel_and_message_ids_when_fetching_single_message", async () => {
    const handler = registeredTools.get("get_message")!;
    await handler({ channel_id: "ch1", message_id: "msg1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/channels/ch1/messages/msg1");
  });
});

describe("edit_message", () => {
  it("should_call_PATCH_with_body_when_editing_message", async () => {
    const handler = registeredTools.get("edit_message")!;
    await handler({ channel_id: "ch1", message_id: "msg1", content: "Updated" });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/channels/ch1/messages/msg1", { content: "Updated" });
  });
});

describe("delete_message", () => {
  it("should_call_DELETE_with_reason_when_deleting_message", async () => {
    const handler = registeredTools.get("delete_message")!;
    await handler({ channel_id: "ch1", message_id: "msg1", reason: "spam" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/channels/ch1/messages/msg1", undefined, undefined, "spam");
  });
});

describe("bulk_delete_messages", () => {
  it("should_call_POST_bulk_delete_when_deleting_multiple_messages", async () => {
    const handler = registeredTools.get("bulk_delete_messages")!;
    await handler({ channel_id: "ch1", messages: ["m1", "m2"] });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/channels/ch1/messages/bulk-delete", { messages: ["m1", "m2"] });
  });
});

describe("crosspost_message", () => {
  it("should_call_POST_crosspost_when_crossposting", async () => {
    const handler = registeredTools.get("crosspost_message")!;
    await handler({ channel_id: "ch1", message_id: "msg1" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/channels/ch1/messages/msg1/crosspost");
  });
});

describe("add_reaction", () => {
  it("should_call_PUT_with_encoded_emoji_when_adding_reaction", async () => {
    const handler = registeredTools.get("add_reaction")!;
    await handler({ channel_id: "ch1", message_id: "msg1", emoji: "👍" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "PUT",
      `/channels/ch1/messages/msg1/reactions/${encodeURIComponent("👍")}/@me`,
    );
  });
});

describe("remove_reaction", () => {
  it("should_call_DELETE_own_reaction_when_no_user_id", async () => {
    const handler = registeredTools.get("remove_reaction")!;
    await handler({ channel_id: "ch1", message_id: "msg1", emoji: "👍" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "DELETE",
      `/channels/ch1/messages/msg1/reactions/${encodeURIComponent("👍")}/@me`,
    );
  });

  it("should_call_DELETE_user_reaction_when_user_id_provided", async () => {
    const handler = registeredTools.get("remove_reaction")!;
    await handler({ channel_id: "ch1", message_id: "msg1", emoji: "👍", user_id: "u1" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "DELETE",
      `/channels/ch1/messages/msg1/reactions/${encodeURIComponent("👍")}/u1`,
    );
  });
});

describe("get_reactions", () => {
  it("should_call_GET_reactions_with_query_params_when_fetching_reactions", async () => {
    const handler = registeredTools.get("get_reactions")!;
    await handler({ channel_id: "ch1", message_id: "msg1", emoji: "👍", limit: 25 });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      `/channels/ch1/messages/msg1/reactions/${encodeURIComponent("👍")}`,
      undefined,
      { limit: 25 },
    );
  });
});

describe("delete_all_reactions", () => {
  it("should_call_DELETE_all_reactions_when_no_emoji", async () => {
    const handler = registeredTools.get("delete_all_reactions")!;
    await handler({ channel_id: "ch1", message_id: "msg1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/channels/ch1/messages/msg1/reactions");
  });

  it("should_call_DELETE_specific_emoji_reactions_when_emoji_provided", async () => {
    const handler = registeredTools.get("delete_all_reactions")!;
    await handler({ channel_id: "ch1", message_id: "msg1", emoji: "🔥" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "DELETE",
      `/channels/ch1/messages/msg1/reactions/${encodeURIComponent("🔥")}`,
    );
  });
});

describe("pin_message", () => {
  it("should_call_PUT_pins_when_pinning_message", async () => {
    const handler = registeredTools.get("pin_message")!;
    await handler({ channel_id: "ch1", message_id: "msg1", reason: "important" });
    expect(callApiSpy).toHaveBeenCalledWith("PUT", "/channels/ch1/pins/msg1", undefined, undefined, "important");
  });
});

describe("unpin_message", () => {
  it("should_call_DELETE_pins_when_unpinning_message", async () => {
    const handler = registeredTools.get("unpin_message")!;
    await handler({ channel_id: "ch1", message_id: "msg1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/channels/ch1/pins/msg1", undefined, undefined, undefined);
  });
});

describe("get_pinned_messages", () => {
  it("should_call_GET_pins_when_fetching_pinned_messages", async () => {
    const handler = registeredTools.get("get_pinned_messages")!;
    await handler({ channel_id: "ch1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/channels/ch1/pins");
  });
});

describe("error handling", () => {
  it("should_return_error_result_when_discord_api_error", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordError(403, 50013, "Missing Permissions"));
    const handler = registeredTools.get("send_message")!;
    const result = await handler({ channel_id: "ch1", content: "test" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Discord error 403");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordRateLimitError(5.0, false));
    const handler = registeredTools.get("send_message")!;
    const result = await handler({ channel_id: "ch1", content: "test" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("rate limit");
  });

  it("should_return_timeout_error_when_request_aborted", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    callApiSpy.mockRejectedValueOnce(abortError);
    const handler = registeredTools.get("get_messages")!;
    const result = await handler({ channel_id: "ch1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("timed out");
  });
});
