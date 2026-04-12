import { describe, it, expect, vi, beforeEach } from "vitest";
import { OllamaClient, OllamaError } from "../src/lib/client.js";

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

function emptyResponse(status = 204) {
  return {
    ok: true,
    status,
    statusText: "No Content",
    text: () => Promise.resolve(""),
    json: () => Promise.reject(new Error("no body")),
  };
}

describe("OllamaClient", () => {
  let client: OllamaClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OllamaClient({ baseUrl: "http://localhost:11434" });
  });

  it("should_use_default_base_url", () => {
    const c = new OllamaClient();
    expect(c).toBeDefined();
  });

  it("should_strip_trailing_slash_from_base_url", async () => {
    const c = new OllamaClient({ baseUrl: "http://localhost:11434/" });
    mockFetch.mockResolvedValue(mockResponse({ models: [] }));
    await c.get("/api/tags");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:11434/api/tags",
      expect.anything(),
    );
  });

  it("should_get_with_correct_url", async () => {
    mockFetch.mockResolvedValue(mockResponse({ models: [] }));
    await client.get("/api/tags");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:11434/api/tags",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("should_post_with_json_body", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ response: "Hello", done: true }),
    );
    await client.post("/api/generate", { model: "llama3", prompt: "hi" });
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].method).toBe("POST");
    expect(call[1].headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(call[1].body as string)).toEqual({
      model: "llama3",
      prompt: "hi",
    });
  });

  it("should_post_without_body_when_undefined", async () => {
    mockFetch.mockResolvedValue(mockResponse({ version: "0.20.5" }));
    await client.post("/api/show");
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].body).toBeUndefined();
  });

  it("should_return_parsed_json", async () => {
    const expected = { models: [{ name: "llama3" }] };
    mockFetch.mockResolvedValue(mockResponse(expected));
    const result = await client.get("/api/tags");
    expect(result).toEqual(expected);
  });

  it("should_return_undefined_for_empty_response", async () => {
    mockFetch.mockResolvedValue(emptyResponse());
    const result = await client.post("/api/copy", {
      source: "a",
      destination: "b",
    });
    expect(result).toBeUndefined();
  });

  it("should_throw_OllamaError_on_api_error", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ error: "model not found" }, 404),
    );
    await expect(client.post("/api/show", { model: "nope" })).rejects.toThrow(
      OllamaError,
    );
  });

  it("should_parse_error_message_from_json", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ error: "model 'nope' not found" }, 404),
    );
    try {
      await client.post("/api/show", { model: "nope" });
    } catch (e) {
      const err = e as OllamaError;
      expect(err.status).toBe(404);
      expect(err.detail).toBe("model 'nope' not found");
    }
  });

  it("should_handle_non_json_error_response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      text: () => Promise.resolve("Bad Gateway"),
      json: () => Promise.reject(new Error("not json")),
    });
    await expect(client.get("/api/tags")).rejects.toThrow(OllamaError);
  });

  it("should_delete_with_body", async () => {
    mockFetch.mockResolvedValue(emptyResponse());
    await client.del("/api/delete", { model: "old" });
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].method).toBe("DELETE");
    expect(JSON.parse(call[1].body as string)).toEqual({ model: "old" });
  });

  it("should_head_return_exists_true_on_200", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
    const result = await client.head("/api/blobs/sha256:abc");
    expect(result).toEqual({ exists: true, status: 200 });
  });

  it("should_head_return_exists_false_on_404", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });
    const result = await client.head("/api/blobs/sha256:xyz");
    expect(result).toEqual({ exists: false, status: 404 });
  });
});

describe("OllamaError", () => {
  it("should_have_correct_name", () => {
    const err = new OllamaError(404, "not found");
    expect(err.name).toBe("OllamaError");
    expect(err.message).toBe("Ollama error 404: not found");
  });
});
