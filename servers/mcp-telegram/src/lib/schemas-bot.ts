/**
 * Zod schemas for Telegram MCP tool inputs — chat, bot, webhook, payments.
 */
import { z } from "zod";
import { ChatId, ReplyMarkup, ReplyParameters } from "./schemas.js";

// ── Chat Management ──

export const GetChatSchema = z.object({ chat_id: ChatId });

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

// ── Bot Settings ──

export const SetMyCommandsSchema = z.object({
  commands: z.array(
    z.object({
      command: z.string().min(1).max(32),
      description: z.string().min(3).max(256),
    }),
  ),
  scope: z.record(z.unknown()).optional(),
  language_code: z.string().optional(),
});

export const GetMyCommandsSchema = z.object({
  scope: z.record(z.unknown()).optional().describe("BotCommandScope object"),
  language_code: z.string().optional(),
});

export const DeleteMyCommandsSchema = z.object({
  scope: z.record(z.unknown()).optional().describe("BotCommandScope object"),
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

export const DeleteWebhookSchema = z.object({
  drop_pending_updates: z.boolean().optional(),
});

export const GetUpdatesSchema = z.object({
  offset: z.number().optional(),
  limit: z.number().optional(),
  timeout: z.number().optional(),
  allowed_updates: z.array(z.string()).optional(),
});

export const GetStarTransactionsSchema = z.object({
  offset: z.number().optional(),
  limit: z.number().optional(),
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
