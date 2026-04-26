import { beforeEach, describe, expect, it } from "vitest";
import { TwitchError, TwitchRateLimitError } from "../src/lib/client.js";
import { registerPointsTools } from "../src/tools/points.js";
import { createToolTestContext, type ToolTestContext } from "./helpers.js";

let ctx: ToolTestContext;

beforeEach(() => {
  ctx = createToolTestContext();
  registerPointsTools(ctx.server, ctx.client);
});

describe("points tools", () => {
  it("should_get_custom_rewards_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_custom_rewards")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/channel_points/custom_rewards", undefined, {
      broadcaster_id: "1",
    });
  });

  it("should_create_custom_reward_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("create_custom_reward")!;
    await handler({ broadcaster_id: "1", title: "Test Reward", cost: 100 });
    expect(ctx.callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/channel_points/custom_rewards",
      { title: "Test Reward", cost: 100 },
      { broadcaster_id: "1" },
    );
  });

  it("should_update_custom_reward_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("update_custom_reward")!;
    await handler({ broadcaster_id: "1", id: "r1", title: "Updated", cost: 200 });
    expect(ctx.callApiSpy).toHaveBeenCalledWith(
      "PATCH",
      "/channel_points/custom_rewards",
      { title: "Updated", cost: 200 },
      { broadcaster_id: "1", id: "r1" },
    );
  });

  it("should_delete_custom_reward_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("delete_custom_reward")!;
    await handler({ broadcaster_id: "1", id: "r1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("DELETE", "/channel_points/custom_rewards", undefined, {
      broadcaster_id: "1",
      id: "r1",
    });
  });

  it("should_get_redemptions_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_redemptions")!;
    await handler({ broadcaster_id: "1", reward_id: "r1", status: "UNFULFILLED" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/channel_points/custom_rewards/redemptions", undefined, {
      broadcaster_id: "1",
      reward_id: "r1",
      status: "UNFULFILLED",
    });
  });

  it("should_update_redemption_status_when_single_id", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("update_redemption_status")!;
    await handler({ broadcaster_id: "1", reward_id: "r1", id: "red1", status: "FULFILLED" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith(
      "PATCH",
      "/channel_points/custom_rewards/redemptions",
      { status: "FULFILLED" },
      { broadcaster_id: "1", reward_id: "r1", id: ["red1"] },
    );
  });

  it("should_update_redemption_status_when_array_ids", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("update_redemption_status")!;
    await handler({ broadcaster_id: "1", reward_id: "r1", id: ["red1", "red2"], status: "CANCELED" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith(
      "PATCH",
      "/channel_points/custom_rewards/redemptions",
      { status: "CANCELED" },
      { broadcaster_id: "1", reward_id: "r1", id: ["red1", "red2"] },
    );
  });

  // Error handling
  it("should_return_error_when_TwitchError_thrown", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchError(404, "Reward not found"));
    const handler = ctx.registeredTools.get("get_custom_rewards")!;
    const result = (await handler({ broadcaster_id: "1" })) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("404");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchRateLimitError(25));
    const handler = ctx.registeredTools.get("create_custom_reward")!;
    const result = (await handler({ broadcaster_id: "1", title: "T", cost: 1 })) as {
      isError: boolean;
      content: { text: string }[];
    };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("retry after 25s");
  });

  it("should_return_timeout_error_when_timeout", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    ctx.callApiSpy.mockRejectedValueOnce(err);
    const handler = ctx.registeredTools.get("delete_custom_reward")!;
    const result = (await handler({ broadcaster_id: "1", id: "r1" })) as { content: { text: string }[] };
    expect(result.content[0].text).toBe("Request timed out");
  });
});
