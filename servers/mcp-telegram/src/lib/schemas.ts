/**
 * Zod schemas for Telegram MCP tool inputs.
 * Reusable across tools for consistent validation.
 */
import { z } from "zod";

// ── Common ──

export const ChatId = z.union([z.string(), z.number()]).describe(
  "Chat ID (number) or username (@channel)"
);

export const ParseMode = z
  .enum(["HTML", "MarkdownV2", "Markdown"])
  .optional()
  .describe("Message parse mode");

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

// ── Media ──

export const MediaType = z.enum([
  "photo", "audio", "document", "video", "animation",
  "voice", "video_note", "sticker",
]);

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
  // Audio-specific
  duration: z.number().optional(),
  performer: z.string().optional(),
  title: z.string().optional(),
  // Video-specific
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

// ── Chat Management ──

export const GetChatSchema = z.object({
  chat_id: ChatId,
});

export const SetChatTitleSchema = z.object({
  chat_id: ChatId,
  title: z.string().min(1).max(128),
});

export const SetChatDescriptionSchema = z.object({
  chat_id: ChatId,
  description: z.string().max(255).optional(),
});

export const SetChatPermissionsSchema = z.object({
  chat_id: ChatId,
  permissions: z.record(z.boolean()).describe("ChatPermissions object"),
  use_independent_chat_permissions: z.boolean().optional(),
});

export const BanChatMemberSchema = z.object({
  chat_id: ChatId,
  user_id: z.number(),
  until_date: z.number().optional(),
  revoke_messages: z.boolean().optional(),
});

export const UnbanChatMemberSchema = z.object({
  chat_id: ChatId,
  user_id: z.number(),
  only_if_banned: z.boolean().optional(),
});

export const RestrictChatMemberSchema = z.object({
  chat_id: ChatId,
  user_id: z.number(),
  permissions: z.record(z.boolean()),
  use_independent_chat_permissions: z.boolean().optional(),
  until_date: z.number().optional(),
});

export const PromoteChatMemberSchema = z.object({
  chat_id: ChatId,
  user_id: z.number(),
  is_anonymous: z.boolean().optional(),
  can_manage_chat: z.boolean().optional(),
  can_post_messages: z.boolean().optional(),
  can_edit_messages: z.boolean().optional(),
  can_delete_messages: z.boolean().optional(),
  can_manage_video_chats: z.boolean().optional(),
  can_restrict_members: z.boolean().optional(),
  can_promote_members: z.boolean().optional(),
  can_change_info: z.boolean().optional(),
  can_invite_users: z.boolean().optional(),
  can_pin_messages: z.boolean().optional(),
  can_manage_topics: z.boolean().optional(),
});

export const CreateInviteLinkSchema = z.object({
  chat_id: ChatId,
  name: z.string().max(32).optional(),
  expire_date: z.number().optional(),
  member_limit: z.number().min(1).max(99999).optional(),
  creates_join_request: z.boolean().optional(),
});

export const GetChatMemberSchema = z.object({
  chat_id: ChatId,
  user_id: z.number(),
});

// ── Forum Topics ──

export const CreateForumTopicSchema = z.object({
  chat_id: ChatId,
  name: z.string().min(1).max(128),
  icon_color: z.number().optional(),
  icon_custom_emoji_id: z.string().optional(),
});

export const EditForumTopicSchema = z.object({
  chat_id: ChatId,
  message_thread_id: z.number(),
  name: z.string().max(128).optional(),
  icon_custom_emoji_id: z.string().optional(),
});

export const ForumTopicActionSchema = z.object({
  chat_id: ChatId,
  message_thread_id: z.number(),
});

// ── Reactions ──

export const SetMessageReactionSchema = z.object({
  chat_id: ChatId,
  message_id: z.number(),
  reaction: z.array(z.record(z.unknown())).optional(),
  is_big: z.boolean().optional(),
});

// ── Bot Settings ──

export const SetMyCommandsSchema = z.object({
  commands: z.array(
    z.object({
      command: z.string().min(1).max(32),
      description: z.string().min(3).max(256),
    })
  ),
  scope: z.record(z.unknown()).optional(),
  language_code: z.string().optional(),
});

// ── Webhook ──

export const SetWebhookSchema = z.object({
  url: z.string().url(),
  certificate: z.string().optional(),
  ip_address: z.string().optional(),
  max_connections: z.number().min(1).max(100).optional(),
  allowed_updates: z.array(z.string()).optional(),
  drop_pending_updates: z.boolean().optional(),
  secret_token: z.string().optional(),
});

// ── Payments ──

export const SendInvoiceSchema = z.object({
  chat_id: ChatId,
  title: z.string(),
  description: z.string(),
  payload: z.string(),
  currency: z.string(),
  prices: z.array(z.object({ label: z.string(), amount: z.number() })),
  provider_token: z.string().optional(),
  photo_url: z.string().optional(),
  photo_size: z.number().optional(),
  photo_width: z.number().optional(),
  photo_height: z.number().optional(),
  need_name: z.boolean().optional(),
  need_phone_number: z.boolean().optional(),
  need_email: z.boolean().optional(),
  need_shipping_address: z.boolean().optional(),
  is_flexible: z.boolean().optional(),
  disable_notification: z.boolean().optional(),
  reply_parameters: ReplyParameters,
  reply_markup: ReplyMarkup,
});

// ── Raw API Call ──

export const RawApiCallSchema = z.object({
  method: z.string().min(1).describe("Telegram Bot API method name (e.g. 'sendChecklist')"),
  params: z.record(z.unknown()).optional().describe("Method parameters as key-value pairs"),
});
