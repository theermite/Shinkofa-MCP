import { describe, it, expect, beforeEach } from "vitest";
import { TwitchError, TwitchRateLimitError } from "../src/lib/client.js";
import { registerModerationTools } from "../src/tools/moderation.js";
import { createToolTestContext, type ToolTestContext } from "./helpers.js";

let ctx: ToolTestContext;

beforeEach(() => {
  ctx = createToolTestContext();
  registerModerationTools(ctx.server, ctx.client);
});

describe("moderation tools", () => {
  it("should_get_banned_users_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_banned_users")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/moderation/banned", undefined, { broadcaster_id: "1" });
  });

  it("should_ban_user_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("ban_user")!;
    await handler({ broadcaster_id: "1", moderator_id: "2", user_id: "3", reason: "spam" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/moderation/bans", { data: { user_id: "3", reason: "spam" } }, { broadcaster_id: "1", moderator_id: "2" });
  });

  it("should_unban_user_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("unban_user")!;
    await handler({ broadcaster_id: "1", moderator_id: "2", user_id: "3" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("DELETE", "/moderation/bans", undefined, { broadcaster_id: "1", moderator_id: "2", user_id: "3" });
  });

  it("should_get_blocked_terms_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_blocked_terms")!;
    await handler({ broadcaster_id: "1", moderator_id: "2" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/moderation/blocked_terms", undefined, { broadcaster_id: "1", moderator_id: "2" });
  });

  it("should_add_blocked_term_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("add_blocked_term")!;
    await handler({ broadcaster_id: "1", moderator_id: "2", text: "badword" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/moderation/blocked_terms", { text: "badword" }, { broadcaster_id: "1", moderator_id: "2" });
  });

  it("should_remove_blocked_term_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("remove_blocked_term")!;
    await handler({ broadcaster_id: "1", moderator_id: "2", id: "term1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("DELETE", "/moderation/blocked_terms", undefined, { broadcaster_id: "1", moderator_id: "2", id: "term1" });
  });

  it("should_get_moderators_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_moderators")!;
    await handler({ broadcaster_id: "1" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/moderation/moderators", undefined, { broadcaster_id: "1" });
  });

  it("should_add_moderator_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("add_moderator")!;
    await handler({ broadcaster_id: "1", user_id: "2" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/moderation/moderators", undefined, { broadcaster_id: "1", user_id: "2" });
  });

  it("should_remove_moderator_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce(undefined);
    const handler = ctx.registeredTools.get("remove_moderator")!;
    await handler({ broadcaster_id: "1", user_id: "2" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("DELETE", "/moderation/moderators", undefined, { broadcaster_id: "1", user_id: "2" });
  });

  it("should_get_shield_mode_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_shield_mode")!;
    await handler({ broadcaster_id: "1", moderator_id: "2" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/moderation/shield_mode", undefined, { broadcaster_id: "1", moderator_id: "2" });
  });

  it("should_update_shield_mode_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("update_shield_mode")!;
    await handler({ broadcaster_id: "1", moderator_id: "2", is_active: true });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("PUT", "/moderation/shield_mode", { is_active: true }, { broadcaster_id: "1", moderator_id: "2" });
  });

  it("should_get_automod_settings_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_automod_settings")!;
    await handler({ broadcaster_id: "1", moderator_id: "2" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/automod/settings", undefined, { broadcaster_id: "1", moderator_id: "2" });
  });

  it("should_update_automod_settings_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("update_automod_settings")!;
    await handler({ broadcaster_id: "1", moderator_id: "2", overall_level: 3 });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("PUT", "/automod/settings", { overall_level: 3 }, { broadcaster_id: "1", moderator_id: "2" });
  });

  it("should_warn_user_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("warn_user")!;
    await handler({ broadcaster_id: "1", moderator_id: "2", user_id: "3", reason: "be nice" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("POST", "/moderation/warnings", { data: { user_id: "3", reason: "be nice" } }, { broadcaster_id: "1", moderator_id: "2" });
  });

  it("should_get_unban_requests_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("get_unban_requests")!;
    await handler({ broadcaster_id: "1", moderator_id: "2" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("GET", "/moderation/unban_requests", undefined, { broadcaster_id: "1", moderator_id: "2" });
  });

  it("should_resolve_unban_request_when_called", async () => {
    ctx.callApiSpy.mockResolvedValueOnce({ data: [] });
    const handler = ctx.registeredTools.get("resolve_unban_request")!;
    await handler({ broadcaster_id: "1", moderator_id: "2", unban_request_id: "req1", status: "approved" });
    expect(ctx.callApiSpy).toHaveBeenCalledWith("PATCH", "/moderation/unban_requests", { unban_request_id: "req1", status: "approved", resolution_text: undefined }, { broadcaster_id: "1", moderator_id: "2" });
  });

  // Error handling
  it("should_return_error_when_TwitchError_thrown", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchError(403, "Forbidden"));
    const handler = ctx.registeredTools.get("ban_user")!;
    const result = await handler({ broadcaster_id: "1", moderator_id: "2", user_id: "3", reason: "x" }) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("403");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    ctx.callApiSpy.mockRejectedValueOnce(new TwitchRateLimitError(20));
    const handler = ctx.registeredTools.get("get_banned_users")!;
    const result = await handler({ broadcaster_id: "1" }) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("retry after 20s");
  });

  it("should_return_timeout_error_when_timeout", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    ctx.callApiSpy.mockRejectedValueOnce(err);
    const handler = ctx.registeredTools.get("get_moderators")!;
    const result = await handler({ broadcaster_id: "1" }) as { content: { text: string }[] };
    expect(result.content[0].text).toBe("Request timed out");
  });
});
