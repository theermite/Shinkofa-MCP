import { describe, it, expect, vi, beforeEach } from "vitest";
import { DevtoClient, DevtoError } from "../src/lib/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(data: object | string, status = 200) {
  const body = typeof data === "string" ? data : JSON.stringify(data);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    text: () => Promise.resolve(body),
    json: () =>
      Promise.resolve(typeof data === "object" ? data : JSON.parse(data)),
  };
}

describe("DevtoClient", () => {
  let client: DevtoClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new DevtoClient({ apiKey: "test-key" });
  });

  it("should_throw_if_apiKey_is_empty", () => {
    expect(() => new DevtoClient({ apiKey: "" })).toThrow(
      "DEVTO_API_KEY is required",
    );
  });

  it("should_send_api_key_and_accept_headers", async () => {
    mockFetch.mockResolvedValue(mockResponse([]));
    await client.get("/api/articles");
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].headers["api-key"]).toBe("test-key");
    expect(call[1].headers["Accept"]).toBe(
      "application/vnd.forem.api-v1+json",
    );
  });

  it("should_get_with_correct_url", async () => {
    mockFetch.mockResolvedValue(mockResponse([]));
    await client.get("/api/articles");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://dev.to/api/articles",
      expect.anything(),
    );
  });

  it("should_post_with_json_body", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ id: 1, title: "Test" }),
    );
    await client.post("/api/articles", {
      article: { title: "Test", body_markdown: "content" },
    });
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].method).toBe("POST");
    expect(call[1].headers["Content-Type"]).toBe("application/json");
  });

  it("should_put_with_json_body", async () => {
    mockFetch.mockResolvedValue(mockResponse({ id: 1 }));
    await client.put("/api/articles/1", { article: { title: "Updated" } });
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].method).toBe("PUT");
  });

  it("should_return_parsed_json", async () => {
    const expected = [{ id: 1, title: "Test" }];
    mockFetch.mockResolvedValue(mockResponse(expected));
    const result = await client.get("/api/articles");
    expect(result).toEqual(expected);
  });

  it("should_throw_DevtoError_on_api_error", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ error: "not found" }, 404),
    );
    await expect(client.get("/api/articles/99999")).rejects.toThrow(
      DevtoError,
    );
  });

  it("should_parse_error_detail", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ error: "not authorized" }, 401),
    );
    try {
      await client.get("/api/users/me");
    } catch (e) {
      const err = e as DevtoError;
      expect(err.status).toBe(401);
      expect(err.detail).toBe("not authorized");
    }
  });

  it("should_handle_non_json_error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      text: () => Promise.resolve("Bad Gateway"),
      json: () => Promise.reject(new Error("not json")),
    });
    await expect(client.get("/api/articles")).rejects.toThrow(DevtoError);
  });

  it("should_detect_rate_limiting", () => {
    const err = new DevtoError(429, "Too many requests");
    expect(err.isRateLimited).toBe(true);
  });

  it("should_strip_trailing_slash_from_base_url", async () => {
    const c = new DevtoClient({
      apiKey: "k",
      baseUrl: "https://dev.to/",
    });
    mockFetch.mockResolvedValue(mockResponse([]));
    await c.get("/api/tags");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://dev.to/api/tags",
      expect.anything(),
    );
  });
});

describe("DevtoError", () => {
  it("should_have_correct_name", () => {
    const err = new DevtoError(404, "not found");
    expect(err.name).toBe("DevtoError");
    expect(err.message).toBe("DEV.to error 404: not found");
  });
});
