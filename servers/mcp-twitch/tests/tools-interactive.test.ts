import { beforeEach, describe, expect, it } from "vitest";
import { TwitchError, TwitchRateLimitError } from "../src/lib/client.js";
import { registerInteractiveTools } from "../src/tools/interactive.js";
import { createToolTestContext, type ToolTestContext } from "./helpers.js";

let ctx: ToolTestContext;

beforeEach(() => {
  ctx = createToolTestContext();
  registerInteractiveTools(ctx.server, ctx.client);
});

describe("interactive tools", () => {
  // Polls
  it("should_get_polls_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_polls")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/polls", undefined, { broadcaster_id: "1" });
  });

  it("should_create_poll_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("create_poll")!;
    const params = {
      broadcaster_id: "1",
      title: "Best game?",
      choices: [{ title: "A" }, { title: "B" }],
      duration: 60,
    };
    await handler(params);
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/polls", params);
  });

  it("should_end_poll_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("end_poll")!;
    const params = { broadcaster_id: "1", id: "poll1", status: "TERMINATED" };
    await handler(params);
    expect(ctx.callApiSpy).toHaveBeenCalledWith("PATCH", "/polls", params);
  });

  // Predictions
  it("should_get_predictions_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_predictions")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/predictions", undefined, { broadcaster_id: "1" });
  });

  it("should_create_prediction_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("create_prediction")!;
    const params = {
      broadcaster_id: "1",
      title: "Who wins?",
      outcomes: [{ title: "A" }, { title: "B" }],
      prediction_window: 60,
    };
    await handler(params);
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/predictions", params);
  });

  it("should_end_prediction_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("end_prediction")!;
    const params = { broadcaster_id: "1", id: "pred1", status: "RESOLVED", winning_outcome_id: "out1" };
    await handler(params);
    expect(ctx.callApiSpy).toHaveBeenCalledWith("PATCH", "/predictions", params);
  });

  // Raids
  it("should_start_raid_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("start_raid")!;
    await handler({ from_broadcaster_id: "1", to_broadcaster_id: "2" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/raids", undefined, {
      from_broadcaster_id: "1",
      to_broadcaster_id: "2",
    });
  });

  it("should_cancel_raid_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("cancel_raid")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("DELETE", "/raids", undefined, { broadcaster_id: "1" });
  });

  // Ads
  it("should_start_commercial_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("start_commercial")!;
    await handler({ broadcaster_id: "1", length: 30 });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/channels/commercial", { broadcaster_id: "1", length: 30 });
  });

  it("should_get_ad_schedule_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_ad_schedule")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/channels/ads", undefined, { broadcaster_id: "1" });
  });

  it("should_snooze_ad_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("snooze_ad")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/channels/ads/schedule/snooze", undefined, {
      broadcaster_id: "1",
    });
  });

  // Error handling
  it("should_return_error_when_TwitchError_thrown", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchError(400, "Bad request"));
    const handler = ctx.registeredTools.get("create_poll")!;
    const result = (await handler({
      broadcaster_id: "1",
      title: "T",
      choices: [{ title: "A" }, { title: "B" }],
      duration: 60,
    })) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("400");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchRateLimitError(5));
    const handler = ctx.registeredTools.get("start_raid")!;
    const result = (await handler({ from_broadcaster_id: "1", to_broadcaster_id: "2" })) as {
      isError: boolean;
      content: { text: string }[];
    };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("retry after 5s");
  });

  it("should_return_timeout_error_when_timeout", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    ctx.callApiSpy.mockRejectedValueOnce(err);
    const handler = ctx.registeredTools.get("get_polls")!;
    const result = (await handler({ broadcaster_id: "1" })) as { content: { text: string }[] };
    expect(result.content[0].text).toBe("Request timed out");
  });
});
