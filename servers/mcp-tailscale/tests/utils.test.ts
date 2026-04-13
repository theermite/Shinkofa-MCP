import { describe, it, expect } from "vitest";
import { toolResult, toolError, withErrorHandler } from "../src/lib/utils.js";
import { TailscaleError } from "../src/lib/client.js";

describe("toolResult", () => {
  it("should_format_data_as_json", () => {
    const result = toolResult({ id: "d1" });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "d1" });
  });

  it("should_return_success_for_undefined", () => {
    expect(toolResult(undefined).content[0].text).toBe('{"status":"success"}');
  });
});

describe("toolError", () => {
  it("should_return_error_with_flag", () => {
    const r = toolError("fail");
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toBe("fail");
  });
});

describe("withErrorHandler", () => {
  it("should_pass_through_success", async () => {
    expect(await withErrorHandler(async () => 42)).toBe(42);
  });

  it("should_catch_TailscaleError", async () => {
    const r = await withErrorHandler(async () => {
      throw new TailscaleError(400, "bad");
    });
    expect(r).toHaveProperty("isError", true);
  });

  it("should_include_rate_limit_hint_on_429", async () => {
    const r = await withErrorHandler(async () => {
      throw new TailscaleError(429, "Too many requests");
    });
    expect(
      (r as { content: { text: string }[] }).content[0].text,
    ).toContain("rate limited");
  });

  it("should_include_auth_hint_on_401", async () => {
    const r = await withErrorHandler(async () => {
      throw new TailscaleError(401, "Invalid");
    });
    expect(
      (r as { content: { text: string }[] }).content[0].text,
    ).toContain("TAILSCALE_API_KEY");
  });

  it("should_include_auth_hint_on_403", async () => {
    const r = await withErrorHandler(async () => {
      throw new TailscaleError(403, "Forbidden");
    });
    expect(
      (r as { content: { text: string }[] }).content[0].text,
    ).toContain("TAILSCALE_API_KEY");
  });

  it("should_catch_abort_as_timeout", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    const r = await withErrorHandler(async () => {
      throw err;
    });
    expect((r as { content: { text: string }[] }).content[0].text).toContain(
      "timed out",
    );
  });

  it("should_catch_syntax_error", async () => {
    const err = new Error("unexpected token");
    err.name = "SyntaxError";
    const r = await withErrorHandler(async () => {
      throw err;
    });
    expect((r as { content: { text: string }[] }).content[0].text).toContain(
      "non-JSON",
    );
  });

  it("should_catch_network_type_error", async () => {
    const err = new Error("fetch failed");
    err.name = "TypeError";
    const r = await withErrorHandler(async () => {
      throw err;
    });
    expect((r as { content: { text: string }[] }).content[0].text).toContain(
      "Network error",
    );
  });

  it("should_rethrow_unknown_errors", async () => {
    await expect(
      withErrorHandler(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });
});
