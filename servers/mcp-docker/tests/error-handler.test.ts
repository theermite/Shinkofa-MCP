import { describe, it, expect } from "vitest";
import { DockerError } from "../src/lib/client.js";
import { withErrorHandler, toolResult, toolError } from "../src/lib/utils.js";

describe("toolResult", () => {
  it("should format data as JSON text content", () => {
    const result = toolResult({ foo: "bar" });
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual({ foo: "bar" });
  });

  it("should return success status for undefined", () => {
    const result = toolResult(undefined);
    expect(JSON.parse(result.content[0].text)).toEqual({ status: "success" });
  });
});

describe("toolError", () => {
  it("should format error message with isError flag", () => {
    const result = toolError("Something failed");
    expect(result.content[0].text).toBe("Something failed");
    expect(result.isError).toBe(true);
  });
});

describe("withErrorHandler", () => {
  it("should return result on success", async () => {
    const result = await withErrorHandler(async () => toolResult({ ok: true }));
    expect(result).toEqual(toolResult({ ok: true }));
  });

  it("should catch DockerError and return toolError", async () => {
    const result = await withErrorHandler(async () => {
      throw new DockerError(404, "No such container");
    });
    expect(result).toHaveProperty("isError", true);
    expect(result.content[0].text).toContain("404");
    expect(result.content[0].text).toContain("No such container");
  });

  it("should catch timeout AbortError", async () => {
    const result = await withErrorHandler(async () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    });
    expect(result).toHaveProperty("isError", true);
    expect(result.content[0].text).toContain("timed out");
  });

  it("should catch TypeError as network error", async () => {
    const result = await withErrorHandler(async () => {
      throw new TypeError("fetch failed");
    });
    expect(result).toHaveProperty("isError", true);
    expect(result.content[0].text).toContain("Network error");
  });

  it("should catch SyntaxError as invalid response", async () => {
    const result = await withErrorHandler(async () => {
      throw new SyntaxError("Unexpected token");
    });
    expect(result).toHaveProperty("isError", true);
    expect(result.content[0].text).toContain("non-JSON");
  });

  it("should rethrow unknown errors", async () => {
    await expect(
      withErrorHandler(async () => { throw new RangeError("boom"); })
    ).rejects.toThrow("boom");
  });
});
