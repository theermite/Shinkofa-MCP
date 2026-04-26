import { beforeEach, describe, expect, it } from "vitest";
import { TwitchError, TwitchRateLimitError } from "../src/lib/client.js";
import { registerChatTools } from "../src/tools/chat.js";
import { createToolTestContext, type ToolTestContext } from "./helpers.js";

let ctx: ToolTestContext;

beforeEach(() => {
  ctx = createToolTestContext();
  registerChatTools(ctx.server, ctx.client);
});

describe("chat tools", () => {
  it("should_get_chatters_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_chatters")!;
    await handler({ broadcaster_id: "1", moderator_id: "2" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/chat/chatters", undefined, {
      broadcaster_id: "1",
      moderator_id: "2",
    });
  });

  it("should_get_channel_emotes_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_channel_emotes")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/chat/emotes", undefined, { broadcaster_id: "1" });
  });

  it("should_get_global_emotes_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_global_emotes")!;
    await handler({});
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/chat/emotes/global");
  });

  it("should_get_channel_badges_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_channel_badges")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/chat/badges", undefined, { broadcaster_id: "1" });
  });

  it("should_get_global_badges_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_global_badges")!;
    await handler({});
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/chat/badges/global");
  });

  it("should_get_chat_settings_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_chat_settings")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/chat/settings", undefined, { broadcaster_id: "1" });
  });

  it("should_update_chat_settings_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("update_chat_settings")!;
    await handler({ broadcaster_id: "1", moderator_id: "2", slow_mode: true });
    expect(ctx.callApiSpy).toHaveBeenCalledWith(
      "PATCH",
      "/chat/settings",
      { slow_mode: true },
      { broadcaster_id: "1", moderator_id: "2" },
    );
  });

  it("should_send_chat_announcement_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("send_chat_announcement")!;
    await handler({ broadcaster_id: "1", moderator_id: "2", message: "Hello!", color: "blue" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/chat/announcements",
      { message: "Hello!", color: "blue" },
      { broadcaster_id: "1", moderator_id: "2" },
    );
  });

  it("should_send_shoutout_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("send_shoutout")!;
    await handler({ from_broadcaster_id: "1", to_broadcaster_id: "2", moderator_id: "3" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/chat/shoutouts", undefined, {
      from_broadcaster_id: "1",
      to_broadcaster_id: "2",
      moderator_id: "3",
    });
  });

  it("should_send_chat_message_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("send_chat_message")!;
    await handler({ broadcaster_id: "1", sender_id: "2", message: "Hello" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/chat/messages", {
      broadcaster_id: "1",
      sender_id: "2",
      message: "Hello",
    });
  });

  it("should_delete_chat_message_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("delete_chat_message")!;
    await handler({ broadcaster_id: "1", moderator_id: "2", message_id: "msg1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("DELETE", "/chat/messages", undefined, {
      broadcaster_id: "1",
      moderator_id: "2",
      message_id: "msg1",
    });
  });

  it("should_get_chat_color_when_single_user", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_chat_color")!;
    await handler({ user_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/chat/color", undefined, { user_id: ["1"] });
  });

  it("should_update_chat_color_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("update_chat_color")!;
    await handler({ user_id: "1", color: "blue" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("PUT", "/chat/color", undefined, { user_id: "1", color: "blue" });
  });

  it("should_get_vips_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_vips")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/channels/vips", undefined, { broadcaster_id: "1" });
  });

  it("should_add_vip_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("add_vip")!;
    await handler({ broadcaster_id: "1", user_id: "2" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/channels/vips", undefined, {
      broadcaster_id: "1",
      user_id: "2",
    });
  });

  it("should_remove_vip_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("remove_vip")!;
    await handler({ broadcaster_id: "1", user_id: "2" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("DELETE", "/channels/vips", undefined, {
      broadcaster_id: "1",
      user_id: "2",
    });
  });

  // Error handling
  it("should_return_error_when_TwitchError_thrown", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchError(401, "Unauthorized"));
    const handler = ctx.registeredTools.get("get_chatters")!;
    const result = (await handler({ broadcaster_id: "1", moderator_id: "2" })) as {
      isError: boolean;
      content: { text: string }[];
    };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("401");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchRateLimitError(15));
    const handler = ctx.registeredTools.get("send_chat_message")!;
    const result = (await handler({ broadcaster_id: "1", sender_id: "2", message: "Hi" })) as {
      isError: boolean;
      content: { text: string }[];
    };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("retry after 15s");
  });

  it("should_return_timeout_error_when_request_times_out", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    ctx.callApiSpy.mockRejectedValueOnce(err);
    const handler = ctx.registeredTools.get("get_global_emotes")!;
    const result = (await handler({})) as { content: { text: string }[] };
    expect(result.content[0].text).toBe("Request timed out");
  });
});
