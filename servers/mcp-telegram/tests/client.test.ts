import { beforeEach, describe, expect, it, vi } from "vitest";
import { TelegramClient, TelegramError } from "../src/lib/client.js";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(data: object, status = 200) {
  return {
    json: () => Promise.resolve(data),
    status,
  };
}

describe("TelegramClient", () => {
  let client: TelegramClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new TelegramClient({ botToken: "123:ABC" });
  });

  it("should throw if botToken is empty", () => {
    expect(() => new TelegramClient({ botToken: "" })).toThrow("TELEGRAM_BOT_TOKEN is required");
  });

  it("should construct correct URL", async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true, result: { id: 1 } }));

    await client.callApi("getMe");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.telegram.org/bot123:ABC/getMe",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("should use custom base URL", async () => {
    const customClient = new TelegramClient({
      botToken: "123:ABC",
      apiBaseUrl: "https://custom.api.org",
    });
    mockFetch.mockResolvedValue(mockResponse({ ok: true, result: {} }));

    await customClient.callApi("getMe");

    expect(mockFetch).toHaveBeenCalledWith("https://custom.api.org/bot123:ABC/getMe", expect.any(Object));
  });

  it("should send JSON body for params", async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true, result: { message_id: 42 } }));

    await client.callApi("sendMessage", {
      chat_id: 123,
      text: "hello",
    });

    const call = mockFetch.mock.calls[0]!;
    expect(call[1].headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(call[1].body as string)).toEqual({
      chat_id: 123,
      text: "hello",
    });
  });

  it("should strip undefined and null params", async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true, result: { message_id: 42 } }));

    await client.callApi("sendMessage", {
      chat_id: 123,
      text: "hello",
      parse_mode: undefined,
      reply_markup: null,
    });

    const body = JSON.parse(mockFetch.mock.calls[0]?.[1].body as string);
    expect(body).toEqual({ chat_id: 123, text: "hello" });
    expect(body).not.toHaveProperty("parse_mode");
    expect(body).not.toHaveProperty("reply_markup");
  });

  it("should return result on success", async () => {
    const expectedResult = { message_id: 42, chat: { id: 123 } };
    mockFetch.mockResolvedValue(mockResponse({ ok: true, result: expectedResult }));

    const result = await client.callApi("sendMessage", { chat_id: 123, text: "hi" });
    expect(result).toEqual(expectedResult);
  });

  it("should throw TelegramError on API error", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({
        ok: false,
        error_code: 400,
        description: "Bad Request: chat not found",
      }),
    );

    await expect(client.callApi("sendMessage", { chat_id: -1, text: "hi" })).rejects.toThrow(TelegramError);

    try {
      await client.callApi("sendMessage", { chat_id: -1, text: "hi" });
    } catch (e) {
      const err = e as TelegramError;
      expect(err.code).toBe(400);
      expect(err.description).toBe("Bad Request: chat not found");
      expect(err.isRateLimited).toBe(false);
    }
  });

  it("should handle rate limit errors with retry_after", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({
        ok: false,
        error_code: 429,
        description: "Too Many Requests: retry after 30",
        parameters: { retry_after: 30 },
      }),
    );

    try {
      await client.callApi("sendMessage", { chat_id: 123, text: "spam" });
    } catch (e) {
      const err = e as TelegramError;
      expect(err.isRateLimited).toBe(true);
      expect(err.retryAfter).toBe(30);
    }
  });

  it("should send no body when params are empty", async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true, result: {} }));

    await client.callApi("getMe");

    const call = mockFetch.mock.calls[0]!;
    expect(call[1].body).toBeUndefined();
  });

  it("should throw TelegramError on non-JSON response", async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.reject(new SyntaxError("Unexpected token")),
      status: 502,
    });

    try {
      await client.callApi("getMe");
      expect.unreachable("should have thrown");
    } catch (e) {
      const err = e as TelegramError;
      expect(err).toBeInstanceOf(TelegramError);
      expect(err.code).toBe(502);
      expect(err.description).toContain("Non-JSON");
    }
  });

  it("should send no body when all params are undefined", async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true, result: {} }));

    await client.callApi("getMe", { foo: undefined, bar: null });

    const call = mockFetch.mock.calls[0]!;
    expect(call[1].body).toBeUndefined();
  });
});

describe("TelegramError", () => {
  it("should have correct name", () => {
    const err = new TelegramError(400, "Bad Request");
    expect(err.name).toBe("TelegramError");
  });

  it("should format message", () => {
    const err = new TelegramError(403, "Forbidden: bot was blocked");
    expect(err.message).toBe("Telegram API error 403: Forbidden: bot was blocked");
  });
});
