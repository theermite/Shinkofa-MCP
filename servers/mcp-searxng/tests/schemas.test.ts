import { describe, expect, it } from "vitest";
import { NewsSearchSchema, WebSearchSchema } from "../src/lib/schemas.js";

describe("WebSearchSchema", () => {
  it("should_accept_minimal_query", () => {
    const parsed = WebSearchSchema.parse({ query: "elixir phoenix" });
    expect(parsed.query).toBe("elixir phoenix");
  });

  it("should_reject_empty_query", () => {
    expect(() => WebSearchSchema.parse({ query: "" })).toThrow();
  });

  it("should_reject_missing_query", () => {
    expect(() => WebSearchSchema.parse({})).toThrow();
  });

  it("should_accept_full_options", () => {
    const parsed = WebSearchSchema.parse({
      query: "test",
      count: 20,
      language: "fr",
      pageno: 2,
      safesearch: 1,
    });
    expect(parsed.count).toBe(20);
    expect(parsed.language).toBe("fr");
    expect(parsed.pageno).toBe(2);
    expect(parsed.safesearch).toBe(1);
  });

  it("should_reject_count_over_50", () => {
    expect(() => WebSearchSchema.parse({ query: "x", count: 51 })).toThrow();
  });

  it("should_reject_negative_count", () => {
    expect(() => WebSearchSchema.parse({ query: "x", count: -1 })).toThrow();
  });

  it("should_reject_invalid_safesearch", () => {
    expect(() => WebSearchSchema.parse({ query: "x", safesearch: 3 })).toThrow();
  });
});

describe("NewsSearchSchema", () => {
  it("should_accept_minimal_query", () => {
    const parsed = NewsSearchSchema.parse({ query: "elixir release" });
    expect(parsed.query).toBe("elixir release");
  });

  it("should_accept_time_range", () => {
    const parsed = NewsSearchSchema.parse({ query: "x", timeRange: "day" });
    expect(parsed.timeRange).toBe("day");
  });

  it("should_reject_invalid_time_range", () => {
    expect(() => NewsSearchSchema.parse({ query: "x", timeRange: "hour" })).toThrow();
  });

  it("should_reject_empty_query", () => {
    expect(() => NewsSearchSchema.parse({ query: "" })).toThrow();
  });
});
