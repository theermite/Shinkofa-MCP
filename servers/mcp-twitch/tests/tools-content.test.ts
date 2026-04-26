import { beforeEach, describe, expect, it } from "vitest";
import { TwitchError, TwitchRateLimitError } from "../src/lib/client.js";
import { registerContentTools } from "../src/tools/content.js";
import { createToolTestContext, type ToolTestContext } from "./helpers.js";

let ctx: ToolTestContext;

beforeEach(() => {
  ctx = createToolTestContext();
  registerContentTools(ctx.server, ctx.client);
});

describe("content tools", () => {
  // Clips
  it("should_create_clip_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("create_clip")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/clips", undefined, { broadcaster_id: "1" });
  });

  it("should_get_clips_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_clips")!;
    await handler({ broadcaster_id: "1", first: 5 });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/clips", undefined, { broadcaster_id: "1", first: 5 });
  });

  // Schedule
  it("should_get_schedule_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: {} });
    const handler = ctx.registeredTools.get("get_schedule")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/schedule", undefined, { broadcaster_id: "1" });
  });

  it("should_create_schedule_segment_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: {} });
    const handler = ctx.registeredTools.get("create_schedule_segment")!;
    await handler({ broadcaster_id: "1", start_time: "2026-01-01T00:00:00Z", timezone: "UTC" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/schedule/segment",
      { start_time: "2026-01-01T00:00:00Z", timezone: "UTC" },
      { broadcaster_id: "1" },
    );
  });

  it("should_update_schedule_segment_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: {} });
    const handler = ctx.registeredTools.get("update_schedule_segment")!;
    await handler({ broadcaster_id: "1", id: "seg1", title: "New Title" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith(
      "PATCH",
      "/schedule/segment",
      { title: "New Title" },
      { broadcaster_id: "1", id: "seg1" },
    );
  });

  it("should_delete_schedule_segment_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("delete_schedule_segment")!;
    await handler({ broadcaster_id: "1", id: "seg1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("DELETE", "/schedule/segment", undefined, {
      broadcaster_id: "1",
      id: "seg1",
    });
  });

  // Videos
  it("should_get_videos_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_videos")!;
    await handler({ user_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/videos", undefined, { user_id: "1" });
  });

  it("should_delete_videos_when_single_id", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("delete_videos")!;
    await handler({ id: "v1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("DELETE", "/videos", undefined, { id: ["v1"] });
  });

  it("should_delete_videos_when_array_ids", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("delete_videos")!;
    await handler({ id: ["v1", "v2"] });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("DELETE", "/videos", undefined, { id: ["v1", "v2"] });
  });

  // Search
  it("should_search_categories_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("search_categories")!;
    await handler({ query: "fortnite" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/search/categories", undefined, { query: "fortnite" });
  });

  it("should_search_channels_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("search_channels")!;
    await handler({ query: "ninja", live_only: true });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/search/channels", undefined, {
      query: "ninja",
      live_only: true,
    });
  });

  // Games
  it("should_get_games_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_games")!;
    await handler({ name: "Fortnite" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/games", undefined, { name: "Fortnite" });
  });

  it("should_get_top_games_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_top_games")!;
    await handler({ first: 10 });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/games/top", undefined, { first: 10 });
  });

  // Users
  it("should_get_users_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_users")!;
    await handler({ login: "testuser" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/users", undefined, { login: "testuser" });
  });

  it("should_update_user_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("update_user")!;
    await handler({ description: "Hello world" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("PUT", "/users", undefined, { description: "Hello world" });
  });

  it("should_get_user_blocks_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_user_blocks")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/users/blocks", undefined, { broadcaster_id: "1" });
  });

  it("should_block_user_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("block_user")!;
    await handler({ target_user_id: "2" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("PUT", "/users/blocks", undefined, { target_user_id: "2" });
  });

  it("should_unblock_user_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("unblock_user")!;
    await handler({ target_user_id: "2" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("DELETE", "/users/blocks", undefined, { target_user_id: "2" });
  });

  // Subscriptions
  it("should_get_subscriptions_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_subscriptions")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/subscriptions", undefined, { broadcaster_id: "1" });
  });

  it("should_check_user_subscription_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("check_user_subscription")!;
    await handler({ broadcaster_id: "1", user_id: "2" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/subscriptions/user", undefined, {
      broadcaster_id: "1",
      user_id: "2",
    });
  });

  // Whispers
  it("should_send_whisper_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("send_whisper")!;
    await handler({ from_user_id: "1", to_user_id: "2", message: "Hi there" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/whispers",
      { message: "Hi there" },
      { from_user_id: "1", to_user_id: "2" },
    );
  });

  // EventSub
  it("should_create_eventsub_subscription_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("create_eventsub_subscription")!;
    const params = {
      type: "stream.online",
      version: "1",
      condition: { broadcaster_user_id: "1" },
      transport: { method: "webhook", callback: "https://example.com", secret: "s3cret" },
    };
    await handler(params);
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/eventsub/subscriptions", params);
  });

  it("should_get_eventsub_subscriptions_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_eventsub_subscriptions")!;
    await handler({ type: "stream.online" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/eventsub/subscriptions", undefined, { type: "stream.online" });
  });

  it("should_delete_eventsub_subscription_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("delete_eventsub_subscription")!;
    await handler({ id: "sub1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("DELETE", "/eventsub/subscriptions", undefined, { id: "sub1" });
  });

  // Error handling
  it("should_return_error_when_TwitchError_thrown", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchError(422, "Unprocessable"));
    const handler = ctx.registeredTools.get("create_clip")!;
    const result = (await handler({ broadcaster_id: "1" })) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("422");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchRateLimitError(45));
    const handler = ctx.registeredTools.get("get_videos")!;
    const result = (await handler({ user_id: "1" })) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("retry after 45s");
  });

  it("should_return_timeout_error_when_timeout", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    ctx.callApiSpy.mockRejectedValueOnce(err);
    const handler = ctx.registeredTools.get("send_whisper")!;
    const result = (await handler({ from_user_id: "1", to_user_id: "2", message: "x" })) as {
      content: { text: string }[];
    };
    expect(result.content[0].text).toBe("Request timed out");
  });
});
