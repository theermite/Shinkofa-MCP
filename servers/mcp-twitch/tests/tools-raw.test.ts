import { describe, it, expect, beforeEach } from "vitest";
import { TwitchError, TwitchRateLimitError } from "../src/lib/client.js";
import { registerRawTool } from "../src/tools/raw.js";
import { createToolTestContext, type ToolTestContext } from "./helpers.js";

let ctx: ToolTestContext;

beforeEach(() => {
  ctx = createToolTestContext();
  registerRawTool(ctx.server, ctx.client);
});

describe("raw tool", () => {
  it("should_call_api_with_GET_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("raw_api_call")!;
    await handler({ method: "GET", path: "/charity/campaigns", query: { broadcaster_id: "1" } });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/charity/campaigns", undefined, { broadcaster_id: "1" });
  });

  it("should_call_api_with_POST_and_body_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("raw_api_call")!;
    await handler({ method: "POST", path: "/extensions/chat", body: { text: "Hello", extension_id: "ext1", extension_version: "1.0" } });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/extensions/chat", { text: "Hello", extension_id: "ext1", extension_version: "1.0" }, undefined);
  });

  it("should_handle_undefined_body_and_query_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("raw_api_call")!;
    await handler({ method: "GET", path: "/bits/leaderboard" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/bits/leaderboard", undefined, undefined);
  });

  // Error handling
  it("should_return_error_when_TwitchError_thrown", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchError(401, "Invalid token"));
    const handler = ctx.registeredTools.get("raw_api_call")!;
    const result = await handler({ method: "GET", path: "/test" }) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("401");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchRateLimitError(60));
    const handler = ctx.registeredTools.get("raw_api_call")!;
    const result = await handler({ method: "GET", path: "/test" }) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("retry after 60s");
  });

  it("should_return_timeout_error_when_timeout", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    ctx.callApiSpy.mockRejectedValueOnce(err);
    const handler = ctx.registeredTools.get("raw_api_call")!;
    const result = await handler({ method: "GET", path: "/test" }) as { content: { text: string }[] };
    expect(result.content[0].text).toBe("Request timed out");
  });
});
