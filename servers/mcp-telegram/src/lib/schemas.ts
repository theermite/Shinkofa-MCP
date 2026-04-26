/**
 * Zod schemas for Telegram MCP tool inputs — messages & media.
 */
import { z } from "zod";

// ── Common ──

export const ChatId = z.union([z.string(), z.number()]).describe("Chat ID (number) or username (@channel)");

export const ParseMode = z.enum(["HTML", "MarkdownV2", "Markdown"]).optional().describe("Message parse mode");

export const ReplyMarkup = z
  .record(z.unknown())
  .optional()
  .describe("InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove, or ForceReply");

export const ReplyParameters = z
  .object({
    message_id: z.number(),
    chat_id: ChatId.optional(),
    allow_sending_without_reply: z.boolean().optional(),
    quote: z.string().optional(),
  })
  .optional()
  .describe("Reply parameters for threading");

export const MessageEffectId = z.string().optional().describe("Message effect ID");

// ── Messages ──

export const SendMessageSchema = z.object({
  chat_id: ChatId,
  text: z.string().min(1).max(4096).describe("Message text (1-4096 chars)"),
  parse_mode: ParseMode,
  entities: z.array(z.record(z.unknown())).optional().describe("Message entities"),
  link_preview_options: z.record(z.unknown()).optional(),
  disable_notification: z.boolean().optional(),
  protect_content: z.boolean().optional(),
  message_thread_id: z.number().optional().describe("Forum topic thread ID"),
  reply_parameters: ReplyParameters,
  reply_markup: ReplyMarkup,
  message_effect_id: MessageEffectId,
  business_connection_id: z.string().optional(),
});

export const EditMessageTextSchema = z.object({
  chat_id: ChatId.optional(),
  message_id: z.number().optional(),
  inline_message_id: z.string().optional(),
  text: z.string().min(1).max(4096),
  parse_mode: ParseMode,
  entities: z.array(z.record(z.unknown())).optional(),
  link_preview_options: z.record(z.unknown()).optional(),
  reply_markup: ReplyMarkup,
});

export const DeleteMessageSchema = z.object({
  chat_id: ChatId,
  message_id: z.number(),
});

export const DeleteMessagesSchema = z.object({
  chat_id: ChatId,
  message_ids: z.array(z.number()).min(1).max(100),
});

export const ForwardMessageSchema = z.object({
  chat_id: ChatId,
  from_chat_id: ChatId,
  message_id: z.number(),
  message_thread_id: z.number().optional(),
  disable_notification: z.boolean().optional(),
  protect_content: z.boolean().optional(),
});

export const CopyMessageSchema = z.object({
  chat_id: ChatId,
  from_chat_id: ChatId,
  message_id: z.number(),
  caption: z.string().optional(),
  parse_mode: ParseMode,
  reply_markup: ReplyMarkup,
});

export const PinMessageSchema = z.object({
  chat_id: ChatId,
  message_id: z.number(),
  disable_notification: z.boolean().optional(),
});

export const UnpinMessageSchema = z.object({
  chat_id: ChatId,
  message_id: z.number().optional().describe("If omitted, unpins most recent"),
});

// ── Reactions ──

export const SetMessageReactionSchema = z.object({
  chat_id: ChatId,
  message_id: z.number(),
  reaction: z.array(z.record(z.unknown())).optional(),
  is_big: z.boolean().optional(),
});

// ── Media ──

export const MediaType = z.enum(["photo", "audio", "document", "video", "animation", "voice", "video_note", "sticker"]);

export const SendMediaSchema = z.object({
  chat_id: ChatId,
  type: MediaType,
  media: z.string().describe("File ID, URL, or base64"),
  caption: z.string().max(1024).optional(),
  parse_mode: ParseMode,
  has_spoiler: z.boolean().optional(),
  disable_notification: z.boolean().optional(),
  protect_content: z.boolean().optional(),
  message_thread_id: z.number().optional(),
  reply_parameters: ReplyParameters,
  reply_markup: ReplyMarkup,
  duration: z.number().optional(),
  performer: z.string().optional(),
  title: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  supports_streaming: z.boolean().optional(),
  thumbnail: z.string().optional(),
});

export const SendMediaGroupSchema = z.object({
  chat_id: ChatId,
  media: z.array(z.record(z.unknown())).min(2).max(10).describe("Array of InputMedia"),
  message_thread_id: z.number().optional(),
  disable_notification: z.boolean().optional(),
  protect_content: z.boolean().optional(),
  reply_parameters: ReplyParameters,
});

export const SendLocationSchema = z.object({
  chat_id: ChatId,
  latitude: z.number(),
  longitude: z.number(),
  horizontal_accuracy: z.number().optional(),
  live_period: z.number().optional(),
  heading: z.number().optional(),
  proximity_alert_radius: z.number().optional(),
  disable_notification: z.boolean().optional(),
  reply_parameters: ReplyParameters,
  reply_markup: ReplyMarkup,
});

export const SendContactSchema = z.object({
  chat_id: ChatId,
  phone_number: z.string(),
  first_name: z.string(),
  last_name: z.string().optional(),
  vcard: z.string().optional(),
  disable_notification: z.boolean().optional(),
  reply_parameters: ReplyParameters,
  reply_markup: ReplyMarkup,
});

export const SendPollSchema = z.object({
  chat_id: ChatId,
  question: z.string().max(300),
  options: z.array(z.record(z.unknown())).min(2).max(10),
  is_anonymous: z.boolean().optional(),
  type: z.enum(["regular", "quiz"]).optional(),
  allows_multiple_answers: z.boolean().optional(),
  correct_option_id: z.number().optional(),
  explanation: z.string().optional(),
  open_period: z.number().optional(),
  close_date: z.number().optional(),
  disable_notification: z.boolean().optional(),
  reply_parameters: ReplyParameters,
  reply_markup: ReplyMarkup,
});
