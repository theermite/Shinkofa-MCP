import { describe, expect, it } from "vitest";
import { PlaywrightError } from "../src/lib/browser.js";
import { toolError, toolResult, withErrorHandler } from "../src/lib/utils.js";

describe("toolResult", () => {
  it("should_wrap_data_in_text_content", () => {
    const result = toolResult({ url: "https://example.com" });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text as string)).toEqual({ url: "https://example.com" });
  });
});

describe("toolError", () => {
  it("should_wrap_message_in_error_content", () => {
    const result = toolError("Something failed");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Something failed");
  });
});

describe("withErrorHandler", () => {
  it("should_return_result_on_success", async () => {
    const result = await withErrorHandler(async () => toolResult({ ok: true }));
    expect(result.content).toHaveLength(1);
    expect(JSON.parse(result.content[0].text as string)).toEqual({ ok: true });
  });

  it("should_format_PlaywrightError_with_action", async () => {
    const result = await withErrorHandler(async () => {
      throw new PlaywrightError("click", "Element not found");
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Playwright");
    expect(result.content[0].text).toContain("click");
  });

  it("should_format_PlaywrightError_with_selector", async () => {
    const result = await withErrorHandler(async () => {
      throw new PlaywrightError("fill", "Timeout", "#input");
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("#input");
  });

  it("should_rethrow_unhandled_Error", async () => {
    await expect(
      withErrorHandler(async () => {
        throw new Error("generic failure");
      }),
    ).rejects.toThrow("generic failure");
  });

  it("should_handle_AbortError", async () => {
    const err = new Error("signal timed out");
    err.name = "AbortError";
    const result = await withErrorHandler(async () => {
      throw err;
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("timed out");
  });

  it("should_handle_TypeError", async () => {
    const result = await withErrorHandler(async () => {
      throw new TypeError("fetch failed");
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("fetch failed");
  });
});
