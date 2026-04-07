/**
 * Media tools — send photos, videos, documents, audio, voice, polls, location, contacts.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TelegramClient } from "../lib/client.js";
import {
  SendMediaSchema,
  SendMediaGroupSchema,
  SendLocationSchema,
  SendContactSchema,
  SendPollSchema,
} from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

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
  server.tool(
    "send_media",
    "Send a photo, video, document, audio, voice, animation, video_note, or sticker",
    SendMediaSchema.shape,
    async (params) => {
      const { type, media, ...rest } = params;
      const method = MEDIA_METHOD_MAP[type];
      if (!method) {
        return { content: [{ type: "text", text: `Unknown media type: ${type}` }], isError: true };
      }

      // Map 'media' to the correct field name for the API
      const fieldName = type === "photo" ? "photo"
        : type === "audio" ? "audio"
        : type === "document" ? "document"
        : type === "video" ? "video"
        : type === "animation" ? "animation"
        : type === "voice" ? "voice"
        : type === "video_note" ? "video_note"
        : "sticker";

      const apiParams = { ...rest, [fieldName]: media };
      const result = await client.callApi(method, apiParams);
      return toolResult(result);
    }
  );

  server.tool(
    "send_media_group",
    "Send a group of 2-10 photos, videos, documents, or audio files as an album",
    SendMediaGroupSchema.shape,
    async (params) => {
      const result = await client.callApi("sendMediaGroup", params);
      return toolResult(result);
    }
  );

  server.tool(
    "send_location",
    "Send a geographic location (optionally live)",
    SendLocationSchema.shape,
    async (params) => {
      const result = await client.callApi("sendLocation", params);
      return toolResult(result);
    }
  );

  server.tool(
    "send_contact",
    "Send a phone contact",
    SendContactSchema.shape,
    async (params) => {
      const result = await client.callApi("sendContact", params);
      return toolResult(result);
    }
  );

  server.tool(
    "send_poll",
    "Send a poll or quiz",
    SendPollSchema.shape,
    async (params) => {
      const result = await client.callApi("sendPoll", params);
      return toolResult(result);
    }
  );
}
