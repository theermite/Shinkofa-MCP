import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObsidianClient, ObsidianError } from "../src/lib/client.js";

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  }));
}

function textResponse(text: string, status = 200) {
  return Promise.resolve(new Response(text, {
    status,
    headers: { "content-type": "text/html" },
  }));
}

describe("ObsidianClient — constructor", () => {
  it("should_throw_when_apiKey_missing", () => {
    expect(() => new ObsidianClient({ apiKey: "" })).toThrow("OBSIDIAN_API_KEY is required");
  });

  it("should_use_defaults", () => {
    const client = new ObsidianClient({ apiKey: "key123" });
    expect(client).toBeDefined();
  });
});

describe("ObsidianClient — callApi", () => {
  it("should_send_GET_with_auth_header", async () => {
    fetchSpy.mockReturnValue(jsonResponse({ status: "ok" }));
    const client = new ObsidianClient({ apiKey: "key123" });
    await client.callApi("GET", "/");
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://127.0.0.1:27124/");
    expect(opts.method).toBe("GET");
    expect(opts.headers["Authorization"]).toBe("Bearer key123");
  });

  it("should_use_custom_baseUrl", async () => {
    fetchSpy.mockReturnValue(jsonResponse({}));
    const client = new ObsidianClient({ apiKey: "k", baseUrl: "http://localhost:9999" });
    await client.callApi("GET", "/test");
    expect(fetchSpy.mock.calls[0][0]).toBe("http://localhost:9999/test");
  });

  it("should_send_POST_with_json_body", async () => {
    fetchSpy.mockReturnValue(jsonResponse({}));
    const client = new ObsidianClient({ apiKey: "k" });
    await client.callApi("POST", "/search/", { key: "value" });
    const [, opts] = fetchSpy.mock.calls[0];
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(opts.body).toBe('{"key":"value"}');
  });

  it("should_send_PUT_with_markdown_body", async () => {
    fetchSpy.mockReturnValue(jsonResponse({}));
    const client = new ObsidianClient({ apiKey: "k" });
    await client.callApi("PUT", "/vault/note.md", "# Hello");
    const [, opts] = fetchSpy.mock.calls[0];
    expect(opts.headers["Content-Type"]).toBe("text/markdown");
    expect(opts.body).toBe("# Hello");
  });

  it("should_pass_accept_header", async () => {
    fetchSpy.mockReturnValue(jsonResponse({}));
    const client = new ObsidianClient({ apiKey: "k" });
    await client.callApi("GET", "/vault/note.md", undefined, "application/vnd.olrapi.note+json");
    expect(fetchSpy.mock.calls[0][1].headers["Accept"]).toBe("application/vnd.olrapi.note+json");
  });

  it("should_return_json_data", async () => {
    fetchSpy.mockReturnValue(jsonResponse({ files: ["a.md", "b.md"] }));
    const client = new ObsidianClient({ apiKey: "k" });
    const result = await client.callApi("GET", "/vault/");
    expect(result).toEqual({ files: ["a.md", "b.md"] });
  });

  it("should_return_text_data_for_non_json", async () => {
    fetchSpy.mockReturnValue(textResponse("# Hello World"));
    const client = new ObsidianClient({ apiKey: "k" });
    const result = await client.callApi("GET", "/vault/note.md");
    expect(result).toBe("# Hello World");
  });

  it("should_return_undefined_for_204", async () => {
    fetchSpy.mockReturnValue(Promise.resolve(new Response(null, { status: 204 })));
    const client = new ObsidianClient({ apiKey: "k" });
    const result = await client.callApi("DELETE", "/vault/note.md");
    expect(result).toBeUndefined();
  });

  it("should_throw_ObsidianError_on_non_ok_json", async () => {
    fetchSpy.mockReturnValue(jsonResponse({ message: "Not found" }, 404));
    const client = new ObsidianClient({ apiKey: "k" });
    try {
      await client.callApi("GET", "/vault/missing.md");
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ObsidianError);
      expect((e as ObsidianError).status).toBe(404);
    }
  });

  it("should_throw_ObsidianError_on_non_ok_text", async () => {
    fetchSpy.mockReturnValue(textResponse("Server Error", 502));
    const client = new ObsidianClient({ apiKey: "k" });
    try {
      await client.callApi("GET", "/");
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ObsidianError);
      expect((e as ObsidianError).status).toBe(502);
      expect((e as ObsidianError).description).toBe("Server Error");
    }
  });

  it("should_throw_AbortError_on_timeout", async () => {
    fetchSpy.mockImplementation(() => new Promise((_, reject) => {
      const err = new Error("aborted");
      err.name = "AbortError";
      reject(err);
    }));
    const client = new ObsidianClient({ apiKey: "k", timeoutMs: 1 });
    await expect(client.callApi("GET", "/")).rejects.toThrow();
  });

  it("should_throw_TypeError_on_network_error", async () => {
    fetchSpy.mockRejectedValue(new TypeError("fetch failed"));
    const client = new ObsidianClient({ apiKey: "k" });
    await expect(client.callApi("GET", "/")).rejects.toThrow(TypeError);
  });

  it("should_not_send_body_on_GET", async () => {
    fetchSpy.mockReturnValue(jsonResponse({}));
    const client = new ObsidianClient({ apiKey: "k" });
    await client.callApi("GET", "/vault/", "some content");
    expect(fetchSpy.mock.calls[0][1].body).toBeUndefined();
  });
});

describe("ObsidianError", () => {
  it("should_have_correct_properties", () => {
    const err = new ObsidianError(404, "Not found");
    expect(err.status).toBe(404);
    expect(err.description).toBe("Not found");
    expect(err.name).toBe("ObsidianError");
    expect(err.message).toContain("404");
  });
});
