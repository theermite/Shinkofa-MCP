import { describe, it, expect, vi, beforeEach } from "vitest";
import { TwitchError, TwitchRateLimitError } from "../src/lib/client.js";
import { registerChannelTools } from "../src/tools/channels.js";
import { createToolTestContext, type ToolTestContext } from "./helpers.js";

let ctx: ToolTestContext;

beforeEach(() => {
  ctx = createToolTestContext();
  registerChannelTools(ctx.server, ctx.client);
});

describe("channel tools", () => {
  it("should_get_channel_info_when_single_id", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [{ broadcaster_id: "123" }] });
    const handler = ctx.registeredTools.get("get_channel_info")!;
    const result = await handler({ broadcaster_id: "123" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/channels", undefined, { broadcaster_id: ["123"] });
    expect(result).toHaveProperty("content");
  });

  it("should_get_channel_info_when_array_ids", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_channel_info")!;
    await handler({ broadcaster_id: ["1", "2"] });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/channels", undefined, { broadcaster_id: ["1", "2"] });
  });

  it("should_modify_channel_when_valid_params", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("modify_channel")!;
    await handler({ broadcaster_id: "123", title: "New Title", game_id: "456" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("PATCH", "/channels", { title: "New Title", game_id: "456" }, { broadcaster_id: "123" });
  });

  it("should_get_channel_editors_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_channel_editors")!;
    await handler({ broadcaster_id: "123" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/channels/editors", undefined, { broadcaster_id: "123" });
  });

  it("should_get_channel_followers_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [], total: 0 });
    const handler = ctx.registeredTools.get("get_channel_followers")!;
    await handler({ broadcaster_id: "123", first: 10 });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/channels/followers", undefined, { broadcaster_id: "123", first: 10 });
  });

  it("should_get_followed_channels_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_followed_channels")!;
    await handler({ user_id: "456" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/channels/followed", undefined, { user_id: "456" });
  });

  // Error handling tests
  it("should_return_error_when_TwitchError_thrown", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchError(404, "Channel not found"));
    const handler = ctx.registeredTools.get("get_channel_info")!;
    const result = await handler({ broadcaster_id: "999" }) as { content: { text: string }[]; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("404");
  });

  it("should_return_rate_limit_error_when_TwitchRateLimitError_thrown", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchRateLimitError(30));
    const handler = ctx.registeredTools.get("get_channel_info")!;
    const result = await handler({ broadcaster_id: "123" }) as { content: { text: string }[]; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("retry after 30s");
  });

  it("should_return_timeout_error_when_AbortError_thrown", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    ctx.callApiSpy.mockRejectedValueOnce(err);
    const handler = ctx.registeredTools.get("get_channel_info")!;
    const result = await handler({ broadcaster_id: "123" }) as { content: { text: string }[] };
    expect(result.content[0].text).toBe("Request timed out");
  });
});
