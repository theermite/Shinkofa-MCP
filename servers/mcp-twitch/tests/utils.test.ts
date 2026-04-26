import { describe, it, expect } from "vitest";
import { toolResult, toolError, withErrorHandler } from "../src/lib/utils.js";
import { TwitchError, TwitchRateLimitError } from "../src/lib/client.js";

describe("toolResult", () => {
  it("should_format_data_as_json_text_when_data_provided", () => {
    const result = toolResult({ data: [1, 2] });
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual({ data: [1, 2] });
  });

  it("should_return_success_status_when_data_undefined", () => {
    const result = toolResult(undefined);
    expect(result.content[0].text).toBe('{"status":"success"}');
  });
});

describe("toolError", () => {
  it("should_return_error_content_when_message_provided", () => {
    const result = toolError("something broke");
    expect(result.content[0].text).toBe("something broke");
    expect(result.isError).toBe(true);
  });
});

describe("withErrorHandler", () => {
  it("should_return_result_when_fn_succeeds", async () => {
    const result = await withErrorHandler(async () => toolResult({ ok: true }));
    expect(JSON.parse(result.content[0].text)).toEqual({ ok: true });
  });

  it("should_return_rate_limit_error_when_TwitchRateLimitError", async () => {
    const result = await withErrorHandler(async () => {
      throw new TwitchRateLimitError(42);
    });
    expect(result.content[0].text).toBe("Twitch rate limit: retry after 42s");
    expect((result as { isError?: boolean }).isError).toBe(true);
  });

  it("should_return_twitch_error_when_TwitchError", async () => {
    const result = await withErrorHandler(async () => {
      throw new TwitchError(403, "Forbidden");
    });
    expect(result.content[0].text).toBe("Twitch error 403: Forbidden");
    expect((result as { isError?: boolean }).isError).toBe(true);
  });

  it("should_return_timeout_error_when_AbortError", async () => {
    const result = await withErrorHandler(async () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    });
    expect(result.content[0].text).toBe("Request timed out");
  });

  it("should_return_non_json_error_when_SyntaxError", async () => {
    const result = await withErrorHandler(async () => {
      const err = new Error("Unexpected token");
      err.name = "SyntaxError";
      throw err;
    });
    expect(result.content[0].text).toBe("Invalid API response (non-JSON)");
  });

  it("should_return_network_error_when_TypeError", async () => {
    const result = await withErrorHandler(async () => {
      const err = new Error("fetch failed");
      err.name = "TypeError";
      throw err;
    });
    expect(result.content[0].text).toBe("Network error: fetch failed");
  });

  it("should_rethrow_when_unknown_error", async () => {
    await expect(
      withErrorHandler(async () => {
        throw "string error";
      }),
    ).rejects.toBe("string error");
  });
});
