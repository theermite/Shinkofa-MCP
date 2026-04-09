import { describe, it, expect, beforeEach } from "vitest";
import { TwitchError, TwitchRateLimitError } from "../src/lib/client.js";
import { registerStreamTools } from "../src/tools/streams.js";
import { createToolTestContext, type ToolTestContext } from "./helpers.js";

let ctx: ToolTestContext;

beforeEach(() => {
  ctx = createToolTestContext();
  registerStreamTools(ctx.server, ctx.client);
});

describe("stream tools", () => {
  it("should_get_streams_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_streams")!;
    await handler({ user_id: "123" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/streams", undefined, { user_id: "123" });
  });

  it("should_get_followed_streams_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_followed_streams")!;
    await handler({ user_id: "123" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/streams/followed", undefined, { user_id: "123" });
  });

  it("should_create_stream_marker_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("create_stream_marker")!;
    await handler({ user_id: "123", description: "highlight" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/streams/markers", { user_id: "123", description: "highlight" });
  });

  it("should_get_stream_markers_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_stream_markers")!;
    await handler({ user_id: "123" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/streams/markers", undefined, { user_id: "123" });
  });

  it("should_get_stream_key_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [{ stream_key: "live_xxx" }] });
    const handler = ctx.registeredTools.get("get_stream_key")!;
    await handler({ broadcaster_id: "123" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/streams/key", undefined, { broadcaster_id: "123" });
  });

  // Error handling
  it("should_return_error_when_TwitchError_thrown", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchError(500, "Internal error"));
    const handler = ctx.registeredTools.get("get_streams")!;
    const result = await handler({}) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("500");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchRateLimitError(10));
    const handler = ctx.registeredTools.get("get_stream_key")!;
    const result = await handler({ broadcaster_id: "1" }) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("retry after 10s");
  });

  it("should_return_timeout_error_when_timeout", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    ctx.callApiSpy.mockRejectedValueOnce(err);
    const handler = ctx.registeredTools.get("create_stream_marker")!;
    const result = await handler({ user_id: "1" }) as { content: { text: string }[] };
    expect(result.content[0].text).toBe("Request timed out");
  });
});
