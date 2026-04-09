import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TelegramClient } from "../lib/client.js";
import {
  SendMediaSchema, SendMediaGroupSchema, SendLocationSchema,
  SendContactSchema, SendPollSchema,
} from "../lib/schemas.js";
import { toolResult, toolError, withErrorHandler } from "../lib/utils.js";

const MEDIA_METHOD_MAP: Record<string, string> = {
  photo: "sendPhoto",
  audio: "sendAudio",
  document: "sendDocument",
  video: "sendVideo",
  animation: "sendAnimation",
  voice: "sendVoice",
  video_note: "sendVideoNote",
  sticker: "sendSticker",
};

export function registerMediaTools(server: McpServer, client: TelegramClient): void {
  server.tool("send_media", "Send a photo, video, document, audio, voice, animation, video_note, or sticker", SendMediaSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { type, media, ...rest } = p;
      const method = MEDIA_METHOD_MAP[type];
      if (!method) return toolError(`Unknown media type: ${type}`);
      const fieldName = type === "photo" ? "photo" : type === "audio" ? "audio" : type === "document" ? "document" : type === "video" ? "video" : type === "animation" ? "animation" : type === "voice" ? "voice" : type === "video_note" ? "video_note" : "sticker";
      return toolResult(await client.callApi(method, { ...rest, [fieldName]: media }));
    })
  );

  server.tool("send_media_group", "Send a group of 2-10 photos, videos, documents, or audio files as an album", SendMediaGroupSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("sendMediaGroup", p)))
  );

  server.tool("send_location", "Send a geographic location (optionally live)", SendLocationSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("sendLocation", p)))
  );

  server.tool("send_contact", "Send a phone contact", SendContactSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("sendContact", p)))
  );

  server.tool("send_poll", "Send a poll or quiz", SendPollSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("sendPoll", p)))
  );
}
