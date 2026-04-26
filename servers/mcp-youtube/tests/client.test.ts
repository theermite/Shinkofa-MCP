import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YouTubeClient, YouTubeError } from "../src/lib/client.js";

function mockFetch(body: unknown, status = 200, ok = true, jsonFails = false) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: "OK",
    json: jsonFails ? () => Promise.reject(new SyntaxError("Unexpected token")) : () => Promise.resolve(body),
  } as unknown as Response);
}

describe("YouTubeClient — constructor", () => {
  it("should_throw_when_no_credentials", () => {
    expect(() => new YouTubeClient({})).toThrow("YOUTUBE_API_KEY or GOOGLE_ACCESS_TOKEN is required");
  });

  it("should_construct_with_api_key", () => {
    expect(new YouTubeClient({ apiKey: "AIza_test" })).toBeDefined();
  });

  it("should_construct_with_access_token", () => {
    expect(new YouTubeClient({ accessToken: "ya29.test" })).toBeDefined();
  });

  it("should_construct_with_custom_settings", () => {
    const c = new YouTubeClient({
      apiKey: "AIza_test",
      apiBaseUrl: "https://custom.googleapis.com/youtube/v3",
      timeoutMs: 5000,
    });
    expect(c).toBeDefined();
  });
});

describe("YouTubeClient — callApi", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("should_make_GET_request_with_api_key", async () => {
    globalThis.fetch = mockFetch({ items: [] });
    const client = new YouTubeClient({ apiKey: "AIza_test" });
    const result = await client.callApi("GET", "/videos", undefined, { id: "abc123", part: "snippet" });
    expect(result).toEqual({ items: [] });
    expect(globalThis.fetch).toHaveBeenCalledOnce();
    const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("https://www.googleapis.com/youtube/v3/videos");
    expect(url).toContain("key=AIza_test");
    expect(url).toContain("id=abc123");
    expect(opts.method).toBe("GET");
  });

  it("should_use_bearer_token_when_access_token_provided", async () => {
    globalThis.fetch = mockFetch({ items: [] });
    const client = new YouTubeClient({ accessToken: "ya29.test" });
    await client.callApi("GET", "/videos", undefined, { part: "snippet" });
    const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).not.toContain("key=");
    expect(opts.headers.Authorization).toBe("Bearer ya29.test");
  });

  it("should_send_json_body_on_POST", async () => {
    globalThis.fetch = mockFetch({ id: "vid_1" });
    const client = new YouTubeClient({ apiKey: "AIza_test" });
    await client.callApi("POST", "/videos", { snippet: { title: "Test" } }, { part: "snippet" });
    const [, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(opts.body)).toEqual({ snippet: { title: "Test" } });
  });

  it("should_return_undefined_on_204", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 } as unknown as Response);
    const client = new YouTubeClient({ apiKey: "AIza_test" });
    const result = await client.callApi("DELETE", "/videos", undefined, { id: "abc" });
    expect(result).toBeUndefined();
  });

  it("should_throw_YouTubeError_on_non_json_response", async () => {
    globalThis.fetch = mockFetch(null, 500, false, true);
    const client = new YouTubeClient({ apiKey: "AIza_test" });
    await expect(client.callApi("GET", "/videos")).rejects.toThrow(YouTubeError);
    await expect(client.callApi("GET", "/videos")).rejects.toThrow("Non-JSON response");
  });

  it("should_throw_YouTubeError_on_api_error", async () => {
    globalThis.fetch = mockFetch({ error: { code: 403, message: "Forbidden" } }, 403, false);
    const client = new YouTubeClient({ apiKey: "AIza_test" });
    await expect(client.callApi("GET", "/videos")).rejects.toThrow(YouTubeError);
  });

  it("should_skip_undefined_and_null_query_params", async () => {
    globalThis.fetch = mockFetch({ items: [] });
    const client = new YouTubeClient({ apiKey: "AIza_test" });
    await client.callApi("GET", "/videos", undefined, { part: "snippet", id: undefined, maxResults: 5 });
    const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("part=snippet");
    expect(url).toContain("maxResults=5");
    expect(url).not.toContain("id=");
  });

  it("should_handle_array_query_params", async () => {
    globalThis.fetch = mockFetch({ items: [] });
    const client = new YouTubeClient({ apiKey: "AIza_test" });
    await client.callApi("GET", "/videos", undefined, { part: ["snippet", "statistics"] } as any);
    const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("part=snippet");
    expect(url).toContain("part=statistics");
  });
});

describe("YouTubeError", () => {
  it("should_store_code_and_description", () => {
    const err = new YouTubeError(404, "Not Found");
    expect(err.code).toBe(404);
    expect(err.description).toBe("Not Found");
    expect(err.name).toBe("YouTubeError");
    expect(err.message).toContain("404");
  });
});
