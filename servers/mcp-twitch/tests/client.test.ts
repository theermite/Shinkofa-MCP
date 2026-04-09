import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TwitchClient, TwitchError, TwitchRateLimitError } from "../src/lib/client.js";

describe("TwitchClient", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should_throw_when_clientId_is_missing", () => {
      expect(() => new TwitchClient({ clientId: "" })).toThrow("TWITCH_CLIENT_ID is required");
    });

    it("should_create_instance_when_valid_config", () => {
      const client = new TwitchClient({ clientId: "abc", accessToken: "tok" });
      expect(client).toBeInstanceOf(TwitchClient);
    });
  });

  describe("callApi", () => {
    it("should_call_fetch_with_correct_url_and_headers_when_GET", async () => {
      const client = new TwitchClient({ clientId: "cid", accessToken: "tok" });
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }));

      await client.callApi("GET", "/channels", undefined, { broadcaster_id: "123" });

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe("https://api.twitch.tv/helix/channels?broadcaster_id=123");
      expect((opts as RequestInit).method).toBe("GET");
      expect((opts as RequestInit).headers).toMatchObject({
        Authorization: "Bearer tok",
        "Client-Id": "cid",
      });
    });

    it("should_send_json_body_when_POST", async () => {
      const client = new TwitchClient({ clientId: "cid", accessToken: "tok" });
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }));

      await client.callApi("POST", "/chat/messages", { message: "hello" });

      const [, opts] = fetchSpy.mock.calls[0];
      expect((opts as RequestInit).body).toBe(JSON.stringify({ message: "hello" }));
      expect((opts as RequestInit).headers).toMatchObject({ "Content-Type": "application/json" });
    });

    it("should_strip_undefined_values_from_body_when_POST", async () => {
      const client = new TwitchClient({ clientId: "cid", accessToken: "tok" });
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

      await client.callApi("POST", "/test", { a: "yes", b: undefined, c: null });

      const [, opts] = fetchSpy.mock.calls[0];
      expect((opts as RequestInit).body).toBe(JSON.stringify({ a: "yes" }));
    });

    it("should_handle_array_query_params_when_GET", async () => {
      const client = new TwitchClient({ clientId: "cid", accessToken: "tok" });
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

      await client.callApi("GET", "/users", undefined, { id: ["1", "2", "3"] });

      const [url] = fetchSpy.mock.calls[0];
      expect(url).toBe("https://api.twitch.tv/helix/users?id=1&id=2&id=3");
    });

    it("should_skip_undefined_query_params_when_GET", async () => {
      const client = new TwitchClient({ clientId: "cid", accessToken: "tok" });
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

      await client.callApi("GET", "/test", undefined, { a: "1", b: undefined });

      const [url] = fetchSpy.mock.calls[0];
      expect(url).toBe("https://api.twitch.tv/helix/test?a=1");
    });

    it("should_return_undefined_when_204_no_content", async () => {
      const client = new TwitchClient({ clientId: "cid", accessToken: "tok" });
      fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));

      const result = await client.callApi("DELETE", "/test");
      expect(result).toBeUndefined();
    });

    it("should_throw_TwitchError_when_response_not_ok", async () => {
      const client = new TwitchClient({ clientId: "cid", accessToken: "tok" });
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ message: "Not found" }), { status: 404 }));

      try {
        await client.callApi("GET", "/nope");
        expect.unreachable("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(TwitchError);
        expect((e as TwitchError).status).toBe(404);
        expect((e as TwitchError).description).toBe("Not found");
      }
    });

    it("should_throw_TwitchError_when_json_parse_fails", async () => {
      const client = new TwitchClient({ clientId: "cid", accessToken: "tok" });
      fetchSpy.mockResolvedValueOnce(new Response("not json", { status: 200, headers: { "Content-Type": "text/plain" } }));

      await expect(client.callApi("GET", "/bad")).rejects.toThrow(TwitchError);
    });

    it("should_throw_TwitchRateLimitError_when_429", async () => {
      const client = new TwitchClient({ clientId: "cid", accessToken: "tok" });
      const resetTime = Math.floor(Date.now() / 1000) + 30;
      fetchSpy.mockResolvedValueOnce(
        new Response(null, { status: 429, headers: { "Ratelimit-Reset": String(resetTime) } }),
      );

      await expect(client.callApi("GET", "/limited")).rejects.toThrow(TwitchRateLimitError);
    });

    it("should_default_retryAfter_to_60_when_no_header_on_429", async () => {
      const client = new TwitchClient({ clientId: "cid", accessToken: "tok" });
      fetchSpy.mockResolvedValueOnce(new Response(null, { status: 429 }));

      try {
        await client.callApi("GET", "/limited");
      } catch (e) {
        expect(e).toBeInstanceOf(TwitchRateLimitError);
        expect((e as TwitchRateLimitError).retryAfter).toBe(60);
      }
    });
  });

  describe("token refresh", () => {
    it("should_refresh_token_when_no_access_token_and_client_secret_available", async () => {
      const client = new TwitchClient({ clientId: "cid", clientSecret: "secret" });

      // First call: token refresh
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "new_tok", expires_in: 3600, token_type: "bearer" }), { status: 200 }),
      );
      // Second call: actual API
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }));

      await client.callApi("GET", "/channels", undefined, { broadcaster_id: "1" });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      const [tokenUrl] = fetchSpy.mock.calls[0];
      expect(tokenUrl).toBe("https://id.twitch.tv/oauth2/token");
    });

    it("should_throw_when_no_token_and_no_secret", async () => {
      const client = new TwitchClient({ clientId: "cid" });

      await expect(client.callApi("GET", "/test")).rejects.toThrow(
        "No access token available and no client secret for app token refresh",
      );
    });

    it("should_throw_TwitchError_when_token_refresh_fails", async () => {
      const client = new TwitchClient({ clientId: "cid", clientSecret: "secret" });
      fetchSpy.mockResolvedValueOnce(new Response("", { status: 401, statusText: "Unauthorized" }));

      await expect(client.callApi("GET", "/test")).rejects.toThrow(TwitchError);
    });
  });
});
