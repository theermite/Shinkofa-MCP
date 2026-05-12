import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearxngClient, SearxngError } from "../src/lib/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(data: object | string, status = 200) {
  const body = typeof data === "string" ? data : JSON.stringify(data);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    text: () => Promise.resolve(body),
    json: () => Promise.resolve(typeof data === "object" ? data : JSON.parse(data)),
  };
}

function fakeSearchPayload(resultCount = 3) {
  return {
    query: "elixir phoenix",
    number_of_results: resultCount,
    results: Array.from({ length: resultCount }, (_, i) => ({
      url: `https://example.com/${i}`,
      title: `Result ${i}`,
      content: `Snippet ${i}`,
      engine: "duckduckgo",
      category: "general",
    })),
    suggestions: ["elixir phoenix tutorial"],
    answers: [],
  };
}

describe("SearxngClient", () => {
  let client: SearxngClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new SearxngClient({ baseUrl: "http://searxng:8080" });
  });

  it("should_use_default_base_url_when_none_provided", () => {
    const c = new SearxngClient();
    expect(c).toBeDefined();
  });

  it("should_strip_trailing_slash_from_base_url", async () => {
    const c = new SearxngClient({ baseUrl: "http://searxng:8080/" });
    mockFetch.mockResolvedValue(mockResponse(fakeSearchPayload()));
    await c.search({ query: "test" });
    const call = mockFetch.mock.calls[0]!;
    expect(call[0] as string).toMatch(/^http:\/\/searxng:8080\/search\?/);
  });

  it("should_GET_search_with_format_json", async () => {
    mockFetch.mockResolvedValue(mockResponse(fakeSearchPayload()));
    await client.search({ query: "phoenix framework" });
    const call = mockFetch.mock.calls[0]!;
    const url = call[0] as string;
    expect(url).toContain("/search?");
    expect(url).toContain("q=phoenix+framework");
    expect(url).toContain("format=json");
    expect(call[1].method).toBe("GET");
  });

  it("should_send_accept_and_user_agent_headers", async () => {
    mockFetch.mockResolvedValue(mockResponse(fakeSearchPayload()));
    await client.search({ query: "test" });
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].headers.Accept).toBe("application/json");
    expect(call[1].headers["User-Agent"]).toContain("shinkofa-mcp-searxng");
  });

  it("should_pass_categories_when_provided", async () => {
    mockFetch.mockResolvedValue(mockResponse(fakeSearchPayload()));
    await client.search({ query: "news today", categories: ["news"] });
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("categories=news");
  });

  it("should_pass_language_when_provided", async () => {
    mockFetch.mockResolvedValue(mockResponse(fakeSearchPayload()));
    await client.search({ query: "x", language: "fr" });
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("language=fr");
  });

  it("should_pass_time_range_when_provided", async () => {
    mockFetch.mockResolvedValue(mockResponse(fakeSearchPayload()));
    await client.search({ query: "x", timeRange: "week" });
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("time_range=week");
  });

  it("should_clip_results_to_count_when_provided", async () => {
    mockFetch.mockResolvedValue(mockResponse(fakeSearchPayload(10)));
    const result = await client.search({ query: "x", count: 3 });
    expect(result.results).toHaveLength(3);
  });

  it("should_not_clip_when_count_is_undefined", async () => {
    mockFetch.mockResolvedValue(mockResponse(fakeSearchPayload(10)));
    const result = await client.search({ query: "x" });
    expect(result.results).toHaveLength(10);
  });

  it("should_throw_SearxngError_on_http_error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      text: () => Promise.resolve("upstream down"),
    });
    await expect(client.search({ query: "x" })).rejects.toThrow(SearxngError);
  });

  it("should_preserve_status_and_detail_on_error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: () => Promise.resolve("rate limited"),
    });
    try {
      await client.search({ query: "x" });
      expect.fail("should have thrown");
    } catch (e) {
      const err = e as SearxngError;
      expect(err.status).toBe(403);
      expect(err.detail).toContain("rate limited");
    }
  });
});

describe("SearxngError", () => {
  it("should_have_correct_name_and_message", () => {
    const err = new SearxngError(500, "boom");
    expect(err.name).toBe("SearxngError");
    expect(err.message).toBe("SearXNG error 500: boom");
    expect(err.status).toBe(500);
    expect(err.detail).toBe("boom");
  });
});
