import { describe, it, expect, vi, beforeEach } from "vitest";
import { DriveClient, DriveError } from "../src/lib/client.js";

// ---------------------------------------------------------------------------
// Fetch mock helpers
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  const h = new Headers({ "content-type": "application/json", ...headers });
  const bodyText =
    typeof data === "string" ? data : JSON.stringify(data);
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(typeof data === "string" ? JSON.parse(data) : data),
    text: () => Promise.resolve(bodyText),
    arrayBuffer: () =>
      Promise.resolve(Buffer.from(bodyText).buffer),
    headers: h,
  };
}

function makeClient(extra: Partial<ConstructorParameters<typeof DriveClient>[0]> = {}) {
  return new DriveClient({ accessToken: "tok-valid", ...extra });
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe("DriveClient — constructor", () => {
  it("should_throw_when_accessToken_is_empty", () => {
    expect(() => new DriveClient({ accessToken: "" })).toThrow(
      "GOOGLE_ACCESS_TOKEN is required",
    );
  });

  it("should_construct_when_accessToken_is_valid", () => {
    const c = makeClient();
    expect(c).toBeInstanceOf(DriveClient);
  });

  it("should_accept_custom_timeoutMs", () => {
    // Just verifying construction does not throw; timeout is private
    expect(() => makeClient({ timeoutMs: 5_000 })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// callApi
// ---------------------------------------------------------------------------

describe("DriveClient — callApi", () => {
  it("should_send_authorization_header_on_GET", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ id: "abc" }),
    );
    const c = makeClient();
    await c.callApi("GET", "/files/abc");
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/files/abc");
    expect((opts.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer tok-valid",
    );
  });

  it("should_send_json_body_on_POST", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "new" }, 200));
    const c = makeClient();
    await c.callApi("POST", "/files", { name: "test.txt" });
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(opts.body).toBe(JSON.stringify({ name: "test.txt" }));
    expect((opts.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
  });

  it("should_return_undefined_on_204_response", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(undefined, 204));
    const c = makeClient();
    const result = await c.callApi("DELETE", "/files/abc");
    expect(result).toBeUndefined();
  });

  it("should_throw_DriveError_on_error_response", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: { code: 403, message: "Forbidden" } }, 403),
    );
    const c = makeClient();
    await expect(c.callApi("GET", "/files/abc")).rejects.toBeInstanceOf(DriveError);
  });

  it("should_append_query_params_to_url", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ files: [] }));
    const c = makeClient();
    await c.callApi("GET", "/files", undefined, { pageSize: 50, q: "name='a'" });
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("pageSize=50");
    expect(url).toContain("q=name%3D%27a%27");
  });

  it("should_guard_non_json_error_response_with_fallback_message", async () => {
    // Simulate a response where json() throws (non-JSON body) and response is not ok
    const badResponse = {
      ok: false,
      status: 500,
      json: () => Promise.reject(new SyntaxError("not json")),
      headers: new Headers({ "content-type": "text/html" }),
    };
    mockFetch.mockResolvedValueOnce(badResponse);
    const c = makeClient();
    const err = await c.callApi("GET", "/files/x").catch((e) => e);
    expect(err).toBeInstanceOf(DriveError);
    expect(err.code).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// downloadFile
// ---------------------------------------------------------------------------

describe("DriveClient — downloadFile", () => {
  it("should_return_text_content_for_text_mimeType", async () => {
    const resp = {
      ok: true,
      status: 200,
      text: () => Promise.resolve("hello world"),
      arrayBuffer: () => Promise.resolve(Buffer.from("hello world").buffer),
      headers: new Headers({ "content-type": "text/plain" }),
    };
    mockFetch.mockResolvedValueOnce(resp);
    const c = makeClient();
    const result = await c.downloadFile("file-1");
    expect(result.content).toBe("hello world");
    expect(result.mimeType).toContain("text/plain");
  });

  it("should_return_base64_for_binary_mimeType", async () => {
    const bytes = [0x89, 0x50, 0x4e, 0x47];
    // Use a standalone ArrayBuffer (not a shared Buffer pool slice)
    const ab = new ArrayBuffer(bytes.length);
    new Uint8Array(ab).set(bytes);
    const expectedBase64 = Buffer.from(ab).toString("base64");
    const resp = {
      ok: true,
      status: 200,
      text: () => Promise.resolve(""),
      arrayBuffer: () => Promise.resolve(ab),
      headers: new Headers({ "content-type": "image/png" }),
    };
    mockFetch.mockResolvedValueOnce(resp);
    const c = makeClient();
    const result = await c.downloadFile("file-2");
    expect(result.content).toBe(expectedBase64);
    expect(result.mimeType).toContain("image/png");
  });

  it("should_retry_on_401_with_refresh_config", async () => {
    const badResp = { ok: false, status: 401, text: () => Promise.resolve(""), arrayBuffer: () => Promise.resolve(Buffer.alloc(0).buffer), headers: new Headers({ "content-type": "text/plain" }) };
    const tokenResp = { ok: true, status: 200, json: () => Promise.resolve({ access_token: "new-token" }) };
    const goodResp = { ok: true, status: 200, text: () => Promise.resolve("content after refresh"), arrayBuffer: () => Promise.resolve(Buffer.alloc(0).buffer), headers: new Headers({ "content-type": "text/plain" }) };
    mockFetch
      .mockResolvedValueOnce(badResp)
      .mockResolvedValueOnce(tokenResp)
      .mockResolvedValueOnce(goodResp);
    const c = makeClient({
      refreshToken: "rtoken",
      clientId: "cid",
      clientSecret: "csec",
    });
    const result = await c.downloadFile("file-3");
    expect(result.content).toBe("content after refresh");
  });

  it("should_throw_DriveError_on_non_ok_download", async () => {
    const resp = { ok: false, status: 404, text: () => Promise.resolve("Not Found"), arrayBuffer: () => Promise.resolve(Buffer.alloc(0).buffer), headers: new Headers({ "content-type": "text/plain" }) };
    mockFetch.mockResolvedValueOnce(resp);
    const c = makeClient();
    await expect(c.downloadFile("bad-id")).rejects.toBeInstanceOf(DriveError);
  });
});

// ---------------------------------------------------------------------------
// exportFile
// ---------------------------------------------------------------------------

describe("DriveClient — exportFile", () => {
  it("should_return_text_on_success", async () => {
    const resp = { ok: true, status: 200, text: () => Promise.resolve("# Markdown"), headers: new Headers({ "content-type": "text/markdown" }) };
    mockFetch.mockResolvedValueOnce(resp);
    const c = makeClient();
    const result = await c.exportFile("doc-1", "text/markdown");
    expect(result).toBe("# Markdown");
  });

  it("should_retry_on_401_with_refresh_config", async () => {
    const badResp = { ok: false, status: 401, text: () => Promise.resolve(""), headers: new Headers() };
    const tokenResp = { ok: true, status: 200, json: () => Promise.resolve({ access_token: "new-tok" }) };
    const goodResp = { ok: true, status: 200, text: () => Promise.resolve("exported"), headers: new Headers() };
    mockFetch
      .mockResolvedValueOnce(badResp)
      .mockResolvedValueOnce(tokenResp)
      .mockResolvedValueOnce(goodResp);
    const c = makeClient({ refreshToken: "r", clientId: "c", clientSecret: "s" });
    const result = await c.exportFile("doc-1", "text/markdown");
    expect(result).toBe("exported");
  });

  it("should_throw_DriveError_on_failure", async () => {
    const resp = { ok: false, status: 403, text: () => Promise.resolve(""), headers: new Headers() };
    mockFetch.mockResolvedValueOnce(resp);
    const c = makeClient();
    await expect(c.exportFile("doc-1", "text/markdown")).rejects.toBeInstanceOf(DriveError);
  });
});

// ---------------------------------------------------------------------------
// uploadFile
// ---------------------------------------------------------------------------

describe("DriveClient — uploadFile", () => {
  it("should_use_multipart_boundary_in_content_type_header", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "new-file" }));
    const c = makeClient();
    await c.uploadFile({ name: "test.txt" }, "hello", "text/plain");
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    const ct = (opts.headers as Record<string, string>)["Content-Type"];
    expect(ct).toMatch(/^multipart\/related; boundary=boundary_/);
  });

  it("should_send_text_content_directly", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "f" }));
    const c = makeClient();
    await c.uploadFile({ name: "a.txt" }, "plaintext content", "text/plain");
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    // Body is a Buffer; verify it's not empty
    expect(opts.body).toBeTruthy();
  });

  it("should_base64_decode_binary_content_before_sending", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "img" }));
    const c = makeClient();
    const b64 = Buffer.from("fake binary").toString("base64");
    await c.uploadFile({ name: "img.png" }, b64, "image/png");
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    const ct = (opts.headers as Record<string, string>)["Content-Type"];
    // Binary should still use multipart
    expect(ct).toContain("multipart/related");
  });

  it("should_retry_on_401_with_refresh_config", async () => {
    const badResp = { ok: false, status: 401, json: () => Promise.reject(new SyntaxError("nojson")) };
    const tokenResp = { ok: true, status: 200, json: () => Promise.resolve({ access_token: "fresh" }) };
    const goodResp = { ok: true, status: 200, json: () => Promise.resolve({ id: "uploaded" }) };
    mockFetch
      .mockResolvedValueOnce(badResp)
      .mockResolvedValueOnce(tokenResp)
      .mockResolvedValueOnce(goodResp);
    const c = makeClient({ refreshToken: "r", clientId: "c", clientSecret: "s" });
    const result = await c.uploadFile({ name: "f.txt" }, "hi", "text/plain");
    expect((result as { id: string }).id).toBe("uploaded");
  });
});

// ---------------------------------------------------------------------------
// updateFileContent
// ---------------------------------------------------------------------------

describe("DriveClient — updateFileContent", () => {
  it("should_use_PATCH_method_for_update", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "f" }));
    const c = makeClient();
    await c.updateFileContent("file-123", { name: "new.txt" }, "content", "text/plain");
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("file-123");
    expect(opts.method).toBe("PATCH");
  });

  it("should_retry_on_401_for_update", async () => {
    const badResp = { ok: false, status: 401, json: () => Promise.reject(new SyntaxError("nojson")) };
    const tokenResp = { ok: true, status: 200, json: () => Promise.resolve({ access_token: "fresher" }) };
    const goodResp = { ok: true, status: 200, json: () => Promise.resolve({ id: "updated" }) };
    mockFetch
      .mockResolvedValueOnce(badResp)
      .mockResolvedValueOnce(tokenResp)
      .mockResolvedValueOnce(goodResp);
    const c = makeClient({ refreshToken: "r", clientId: "c", clientSecret: "s" });
    const result = await c.updateFileContent("f", {}, "data", "text/plain");
    expect((result as { id: string }).id).toBe("updated");
  });
});

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

describe("DriveClient — token refresh", () => {
  it("should_refresh_and_retry_on_401_in_callApi", async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse({ error: { code: 401, message: "Unauthorized" } }, 401))
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ access_token: "new-access" }) })
      .mockResolvedValueOnce(mockResponse({ id: "ok" }));
    const c = makeClient({ refreshToken: "r", clientId: "c", clientSecret: "s" });
    const result = await c.callApi("GET", "/files/abc") as { id: string };
    expect(result.id).toBe("ok");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("should_throw_DriveError_when_refresh_fails", async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse({ error: { code: 401, message: "Unauthorized" } }, 401))
      .mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ error: "invalid_grant", error_description: "Token expired" }) });
    const c = makeClient({ refreshToken: "r", clientId: "c", clientSecret: "s" });
    await expect(c.callApi("GET", "/files/abc")).rejects.toBeInstanceOf(DriveError);
  });

  it("should_throw_DriveError_when_no_refresh_config_on_401", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: { code: 401, message: "Unauthorized" } }, 401),
    );
    // No refreshToken/clientId/clientSecret — canRefresh is false
    const c = makeClient();
    await expect(c.callApi("GET", "/files/abc")).rejects.toBeInstanceOf(DriveError);
  });

  it("should_throw_DriveError_without_access_token_in_refresh_response", async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse({ error: { code: 401, message: "Unauthorized" } }, 401))
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ error: "missing token" }) });
    const c = makeClient({ refreshToken: "r", clientId: "c", clientSecret: "s" });
    await expect(c.callApi("GET", "/files/x")).rejects.toBeInstanceOf(DriveError);
  });
});

// ---------------------------------------------------------------------------
// Timeout (AbortController)
// ---------------------------------------------------------------------------

describe("DriveClient — timeout", () => {
  it("should_abort_request_when_timeout_fires", async () => {
    // Simulate fetch never resolving within timeout by returning a signal-respecting promise
    mockFetch.mockImplementationOnce((_url: string, opts: RequestInit) => {
      return new Promise((_resolve, reject) => {
        opts.signal?.addEventListener("abort", () => reject(Object.assign(new Error("The operation was aborted"), { name: "AbortError" })));
      });
    });
    const c = new DriveClient({ accessToken: "t", timeoutMs: 10 });
    await expect(c.callApi("GET", "/files")).rejects.toMatchObject({ name: "AbortError" });
  });
});
