import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TelegramClient, TelegramError } from "../src/lib/client.js";
import { registerMediaTools } from "../src/tools/media.js";

let server: McpServer;
let client: TelegramClient;
let callApiSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: any[]) => any>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new TelegramClient({ botToken: "123:ABC" });
  callApiSpy = vi.spyOn(client, "callApi").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as any);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerMediaTools(server, client);
});

describe("Media tools", () => {
  it("should_send_photo", async () => {
    const cb = registeredTools.get("send_media")!;
    await cb({ chat_id: 123, type: "photo", media: "https://example.com/photo.jpg" });
    expect(callApiSpy).toHaveBeenCalledWith("sendPhoto", { chat_id: 123, photo: "https://example.com/photo.jpg" });
  });

  it("should_send_video", async () => {
    const cb = registeredTools.get("send_media")!;
    await cb({ chat_id: 123, type: "video", media: "file_id_123", caption: "My video" });
    expect(callApiSpy).toHaveBeenCalledWith("sendVideo", { chat_id: 123, video: "file_id_123", caption: "My video" });
  });

  it("should_send_document", async () => {
    const cb = registeredTools.get("send_media")!;
    await cb({ chat_id: 123, type: "document", media: "file_id_doc" });
    expect(callApiSpy).toHaveBeenCalledWith("sendDocument", { chat_id: 123, document: "file_id_doc" });
  });

  it("should_send_audio", async () => {
    const cb = registeredTools.get("send_media")!;
    await cb({ chat_id: 123, type: "audio", media: "file_id_audio" });
    expect(callApiSpy).toHaveBeenCalledWith("sendAudio", { chat_id: 123, audio: "file_id_audio" });
  });

  it("should_send_sticker", async () => {
    const cb = registeredTools.get("send_media")!;
    await cb({ chat_id: 123, type: "sticker", media: "sticker_id" });
    expect(callApiSpy).toHaveBeenCalledWith("sendSticker", { chat_id: 123, sticker: "sticker_id" });
  });

  it("should_send_media_group", async () => {
    const cb = registeredTools.get("send_media_group")!;
    const media = [{ type: "photo", media: "id1" }, { type: "photo", media: "id2" }];
    await cb({ chat_id: 123, media });
    expect(callApiSpy).toHaveBeenCalledWith("sendMediaGroup", { chat_id: 123, media });
  });

  it("should_send_location", async () => {
    const cb = registeredTools.get("send_location")!;
    await cb({ chat_id: 123, latitude: 48.8566, longitude: 2.3522 });
    expect(callApiSpy).toHaveBeenCalledWith("sendLocation", { chat_id: 123, latitude: 48.8566, longitude: 2.3522 });
  });

  it("should_send_contact", async () => {
    const cb = registeredTools.get("send_contact")!;
    await cb({ chat_id: 123, phone_number: "+33612345678", first_name: "Jay" });
    expect(callApiSpy).toHaveBeenCalledWith("sendContact", { chat_id: 123, phone_number: "+33612345678", first_name: "Jay" });
  });

  it("should_send_poll", async () => {
    const cb = registeredTools.get("send_poll")!;
    await cb({ chat_id: 123, question: "Q?", options: [{ text: "A" }, { text: "B" }] });
    expect(callApiSpy).toHaveBeenCalledWith("sendPoll", { chat_id: 123, question: "Q?", options: [{ text: "A" }, { text: "B" }] });
  });
});

describe("Media tools — error handling", () => {
  it("should_handle_TelegramError", async () => {
    callApiSpy.mockRejectedValue(new TelegramError(400, "Bad Request"));
    const cb = registeredTools.get("send_media")!;
    const result = await cb({ chat_id: 123, type: "photo", media: "bad" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("400");
  });

  it("should_handle_timeout_on_media_group", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    callApiSpy.mockRejectedValue(err);
    const cb = registeredTools.get("send_media_group")!;
    const result = await cb({ chat_id: 123, media: [] });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Request timed out");
  });
});
