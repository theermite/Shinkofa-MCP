/**
 * Zod schemas for Discord MCP tool inputs.
 */
import { z } from "zod";

// ── Common ──

export const Snowflake = z.string().describe("Discord snowflake ID");

export const OptionalReason = z.string().optional().describe("Audit log reason (shown in server audit log)");

// ── Messages ──

export const SendMessageSchema = z.object({
  channel_id: Snowflake.describe("Channel to send to"),
  content: z.string().max(2000).optional().describe("Message content (max 2000 chars)"),
  tts: z.boolean().optional().describe("Text-to-speech"),
  embeds: z.array(z.record(z.unknown())).max(10).optional().describe("Up to 10 embeds"),
  components: z.array(z.record(z.unknown())).max(5).optional().describe("Message components (buttons, selects)"),
  sticker_ids: z.array(Snowflake).max(3).optional().describe("Sticker IDs (max 3)"),
  message_reference: z
    .object({
      message_id: Snowflake,
      channel_id: Snowflake.optional(),
      guild_id: Snowflake.optional(),
      fail_if_not_exists: z.boolean().optional(),
    })
    .optional()
    .describe("Reply to a message"),
  flags: z.number().optional().describe("Message flags (e.g. 4096 for SUPPRESS_EMBEDS)"),
});

export const GetMessagesSchema = z.object({
  channel_id: Snowflake.describe("Channel to fetch from"),
  limit: z.number().min(1).max(100).optional().describe("Number of messages (1-100, default 50)"),
  before: Snowflake.optional().describe("Get messages before this ID"),
  after: Snowflake.optional().describe("Get messages after this ID"),
  around: Snowflake.optional().describe("Get messages around this ID"),
});

export const GetMessageSchema = z.object({
  channel_id: Snowflake,
  message_id: Snowflake,
});

export const EditMessageSchema = z.object({
  channel_id: Snowflake,
  message_id: Snowflake,
  content: z.string().max(2000).optional(),
  embeds: z.array(z.record(z.unknown())).max(10).optional(),
  components: z.array(z.record(z.unknown())).max(5).optional(),
  flags: z.number().optional(),
});

export const DeleteMessageSchema = z.object({
  channel_id: Snowflake,
  message_id: Snowflake,
  reason: OptionalReason,
});

export const BulkDeleteMessagesSchema = z.object({
  channel_id: Snowflake,
  messages: z.array(Snowflake).min(2).max(100).describe("Message IDs to delete (2-100)"),
});

export const CrosspostMessageSchema = z.object({
  channel_id: Snowflake.describe("Announcement channel ID"),
  message_id: Snowflake,
});

export const AddReactionSchema = z.object({
  channel_id: Snowflake,
  message_id: Snowflake,
  emoji: z.string().describe("URL-encoded emoji (e.g. '👍' or 'name:id' for custom)"),
});

export const RemoveReactionSchema = z.object({
  channel_id: Snowflake,
  message_id: Snowflake,
  emoji: z.string(),
  user_id: Snowflake.optional().describe("User ID (omit for own reaction)"),
});

export const GetReactionsSchema = z.object({
  channel_id: Snowflake,
  message_id: Snowflake,
  emoji: z.string(),
  limit: z.number().min(1).max(100).optional(),
  after: Snowflake.optional(),
});

export const DeleteAllReactionsSchema = z.object({
  channel_id: Snowflake,
  message_id: Snowflake,
  emoji: z.string().optional().describe("If provided, delete only this emoji's reactions"),
});

export const PinMessageSchema = z.object({
  channel_id: Snowflake,
  message_id: Snowflake,
  reason: OptionalReason,
});

export const GetPinnedMessagesSchema = z.object({
  channel_id: Snowflake,
});

// ── Channels ──

export const GetChannelSchema = z.object({
  channel_id: Snowflake,
});

export const ModifyChannelSchema = z.object({
  channel_id: Snowflake,
  name: z.string().min(1).max(100).optional(),
  type: z.number().optional().describe("Channel type (only text<->news conversion)"),
  position: z.number().optional(),
  topic: z.string().max(1024).optional(),
  nsfw: z.boolean().optional(),
  rate_limit_per_user: z.number().min(0).max(21600).optional().describe("Slowmode in seconds"),
  bitrate: z.number().optional().describe("Voice channel bitrate"),
  user_limit: z.number().min(0).max(99).optional().describe("Voice channel user limit"),
  permission_overwrites: z.array(z.record(z.unknown())).optional(),
  parent_id: Snowflake.optional().describe("Category ID"),
  default_auto_archive_duration: z.number().optional().describe("Thread auto-archive minutes"),
  flags: z.number().optional(),
  reason: OptionalReason,
});

export const DeleteChannelSchema = z.object({
  channel_id: Snowflake,
  reason: OptionalReason,
});

export const EditPermissionsSchema = z.object({
  channel_id: Snowflake,
  overwrite_id: Snowflake.describe("Role or user ID"),
  allow: z.string().optional().describe("Bitwise permission allow value"),
  deny: z.string().optional().describe("Bitwise permission deny value"),
  type: z.number().describe("0 for role, 1 for member"),
  reason: OptionalReason,
});

export const DeletePermissionsSchema = z.object({
  channel_id: Snowflake,
  overwrite_id: Snowflake,
  reason: OptionalReason,
});

export const TriggerTypingSchema = z.object({
  channel_id: Snowflake,
});

export const CreateInviteSchema = z.object({
  channel_id: Snowflake,
  max_age: z.number().optional().describe("Invite duration in seconds (0 = never, default 86400)"),
  max_uses: z.number().optional().describe("Max uses (0 = unlimited)"),
  temporary: z.boolean().optional().describe("Grant temporary membership"),
  unique: z.boolean().optional().describe("Create a unique invite"),
  reason: OptionalReason,
});

export const GetChannelInvitesSchema = z.object({
  channel_id: Snowflake,
});

export const FollowAnnouncementChannelSchema = z.object({
  channel_id: Snowflake.describe("Announcement channel to follow"),
  webhook_channel_id: Snowflake.describe("Channel to receive crossposted messages"),
});

// ── Threads ──

export const CreateThreadFromMessageSchema = z.object({
  channel_id: Snowflake,
  message_id: Snowflake,
  name: z.string().min(1).max(100),
  auto_archive_duration: z.number().optional().describe("Minutes: 60, 1440, 4320, 10080"),
  rate_limit_per_user: z.number().min(0).max(21600).optional(),
  reason: OptionalReason,
});

export const CreateThreadSchema = z.object({
  channel_id: Snowflake,
  name: z.string().min(1).max(100),
  type: z.number().optional().describe("11 = PUBLIC_THREAD, 12 = PRIVATE_THREAD"),
  auto_archive_duration: z.number().optional(),
  invitable: z.boolean().optional().describe("Whether non-moderators can add members (private threads)"),
  rate_limit_per_user: z.number().min(0).max(21600).optional(),
  message: z
    .object({
      content: z.string().max(2000).optional(),
      embeds: z.array(z.record(z.unknown())).max(10).optional(),
      components: z.array(z.record(z.unknown())).max(5).optional(),
    })
    .optional()
    .describe("Initial message for forum/media threads"),
  reason: OptionalReason,
});

export const JoinLeaveThreadSchema = z.object({
  channel_id: Snowflake.describe("Thread ID"),
});

export const AddRemoveThreadMemberSchema = z.object({
  channel_id: Snowflake.describe("Thread ID"),
  user_id: Snowflake,
});

export const ListThreadMembersSchema = z.object({
  channel_id: Snowflake.describe("Thread ID"),
  with_member: z.boolean().optional().describe("Include guild member data"),
  limit: z.number().min(1).max(100).optional(),
  after: Snowflake.optional(),
});

export const ListArchivedThreadsSchema = z.object({
  channel_id: Snowflake,
  type: z.enum(["public", "private"]).describe("Archive type"),
  before: z.string().optional().describe("ISO8601 timestamp"),
  limit: z.number().min(1).max(100).optional(),
});

// ── Guilds ──

export const GetGuildSchema = z.object({
  guild_id: Snowflake,
  with_counts: z.boolean().optional().describe("Include approximate member/presence counts"),
});

export const ModifyGuildSchema = z.object({
  guild_id: Snowflake,
  name: z.string().min(2).max(100).optional(),
  verification_level: z.number().optional().describe("0=none, 1=low, 2=medium, 3=high, 4=very_high"),
  default_message_notifications: z.number().optional().describe("0=all, 1=mentions"),
  explicit_content_filter: z.number().optional().describe("0=disabled, 1=no-roles, 2=all"),
  afk_channel_id: Snowflake.optional(),
  afk_timeout: z.number().optional().describe("AFK timeout in seconds"),
  system_channel_id: Snowflake.optional(),
  system_channel_flags: z.number().optional(),
  rules_channel_id: Snowflake.optional(),
  public_updates_channel_id: Snowflake.optional(),
  preferred_locale: z.string().optional(),
  features: z.array(z.string()).optional(),
  description: z.string().max(120).optional(),
  premium_progress_bar_enabled: z.boolean().optional(),
  safety_alerts_channel_id: Snowflake.optional(),
  reason: OptionalReason,
});

export const GetGuildChannelsSchema = z.object({
  guild_id: Snowflake,
});

export const CreateGuildChannelSchema = z.object({
  guild_id: Snowflake,
  name: z.string().min(1).max(100),
  type: z.number().optional().describe("0=text, 2=voice, 4=category, 5=announcement, 13=stage, 15=forum, 16=media"),
  topic: z.string().max(1024).optional(),
  bitrate: z.number().optional(),
  user_limit: z.number().min(0).max(99).optional(),
  rate_limit_per_user: z.number().min(0).max(21600).optional(),
  position: z.number().optional(),
  permission_overwrites: z.array(z.record(z.unknown())).optional(),
  parent_id: Snowflake.optional().describe("Category ID"),
  nsfw: z.boolean().optional(),
  default_auto_archive_duration: z.number().optional(),
  default_reaction_emoji: z.record(z.unknown()).optional(),
  default_sort_order: z.number().optional(),
  default_forum_layout: z.number().optional(),
  reason: OptionalReason,
});

export const ModifyChannelPositionsSchema = z.object({
  guild_id: Snowflake,
  channels: z.array(
    z.object({
      id: Snowflake,
      position: z.number().optional(),
      lock_permissions: z.boolean().optional(),
      parent_id: Snowflake.optional(),
    }),
  ),
});

export const GetActiveThreadsSchema = z.object({
  guild_id: Snowflake,
});

// ── Guild Welcome Screen & Onboarding ──

export const GetWelcomeScreenSchema = z.object({
  guild_id: Snowflake,
});

export const ModifyWelcomeScreenSchema = z.object({
  guild_id: Snowflake,
  enabled: z.boolean().optional(),
  welcome_channels: z
    .array(
      z.object({
        channel_id: Snowflake,
        description: z.string().max(50),
        emoji_id: Snowflake.optional(),
        emoji_name: z.string().optional(),
      }),
    )
    .max(5)
    .optional(),
  description: z.string().max(140).optional(),
  reason: OptionalReason,
});

export const GetOnboardingSchema = z.object({
  guild_id: Snowflake,
});

export const ModifyOnboardingSchema = z.object({
  guild_id: Snowflake,
  prompts: z.array(z.record(z.unknown())).describe("Onboarding prompts"),
  default_channel_ids: z.array(Snowflake),
  enabled: z.boolean(),
  mode: z.number().describe("0=ONBOARDING_DEFAULT, 1=ONBOARDING_ADVANCED"),
  reason: OptionalReason,
});

// ── Guild Widget ──

export const GetWidgetSettingsSchema = z.object({
  guild_id: Snowflake,
});

export const ModifyWidgetSchema = z.object({
  guild_id: Snowflake,
  enabled: z.boolean().optional(),
  channel_id: Snowflake.optional(),
  reason: OptionalReason,
});

// ── Guild Vanity URL ──

export const GetVanityUrlSchema = z.object({
  guild_id: Snowflake,
});

// ── Members ──

export const GetMemberSchema = z.object({
  guild_id: Snowflake,
  user_id: Snowflake,
});

export const ListMembersSchema = z.object({
  guild_id: Snowflake,
  limit: z.number().min(1).max(1000).optional().describe("Max members to return (default 1)"),
  after: Snowflake.optional().describe("Get members after this user ID"),
});

export const SearchMembersSchema = z.object({
  guild_id: Snowflake,
  query: z.string().describe("Username or nickname to search"),
  limit: z.number().min(1).max(1000).optional().describe("Max results (default 1)"),
});

export const ModifyMemberSchema = z.object({
  guild_id: Snowflake,
  user_id: Snowflake,
  nick: z.string().max(32).optional().describe("Nickname (empty string to reset)"),
  roles: z.array(Snowflake).optional().describe("Array of role IDs"),
  mute: z.boolean().optional().describe("Server mute"),
  deaf: z.boolean().optional().describe("Server deafen"),
  channel_id: Snowflake.optional().describe("Move to voice channel (null to disconnect)"),
  communication_disabled_until: z.string().optional().describe("ISO8601 timeout expiry (null to remove)"),
  flags: z.number().optional(),
  reason: OptionalReason,
});

export const KickMemberSchema = z.object({
  guild_id: Snowflake,
  user_id: Snowflake,
  reason: OptionalReason,
});

export const BanMemberSchema = z.object({
  guild_id: Snowflake,
  user_id: Snowflake,
  delete_message_seconds: z
    .number()
    .min(0)
    .max(604800)
    .optional()
    .describe("Delete messages from last N seconds (max 7 days)"),
  reason: OptionalReason,
});

export const UnbanMemberSchema = z.object({
  guild_id: Snowflake,
  user_id: Snowflake,
  reason: OptionalReason,
});

export const GetBansSchema = z.object({
  guild_id: Snowflake,
  limit: z.number().min(1).max(1000).optional(),
  before: Snowflake.optional(),
  after: Snowflake.optional(),
});

export const GetBanSchema = z.object({
  guild_id: Snowflake,
  user_id: Snowflake,
});

export const BulkBanSchema = z.object({
  guild_id: Snowflake,
  user_ids: z.array(Snowflake).max(200).describe("User IDs to ban (max 200)"),
  delete_message_seconds: z.number().min(0).max(604800).optional(),
  reason: OptionalReason,
});

// ── Roles ──

export const GetRolesSchema = z.object({
  guild_id: Snowflake,
});

export const CreateRoleSchema = z.object({
  guild_id: Snowflake,
  name: z.string().max(100).optional().describe("Role name (default 'new role')"),
  permissions: z.string().optional().describe("Bitwise permission value"),
  color: z.number().optional().describe("RGB color value (0 = default)"),
  hoist: z.boolean().optional().describe("Show role separately in sidebar"),
  mentionable: z.boolean().optional().describe("Allow anyone to @mention this role"),
  unicode_emoji: z.string().optional().describe("Unicode emoji for role icon"),
  reason: OptionalReason,
});

export const ModifyRoleSchema = z.object({
  guild_id: Snowflake,
  role_id: Snowflake,
  name: z.string().max(100).optional(),
  permissions: z.string().optional(),
  color: z.number().optional(),
  hoist: z.boolean().optional(),
  mentionable: z.boolean().optional(),
  unicode_emoji: z.string().optional(),
  reason: OptionalReason,
});

export const DeleteRoleSchema = z.object({
  guild_id: Snowflake,
  role_id: Snowflake,
  reason: OptionalReason,
});

export const ModifyRolePositionsSchema = z.object({
  guild_id: Snowflake,
  roles: z.array(
    z.object({
      id: Snowflake,
      position: z.number().optional(),
    }),
  ),
});

export const AssignRoleSchema = z.object({
  guild_id: Snowflake,
  user_id: Snowflake,
  role_id: Snowflake,
  reason: OptionalReason,
});

export const RemoveRoleSchema = z.object({
  guild_id: Snowflake,
  user_id: Snowflake,
  role_id: Snowflake,
  reason: OptionalReason,
});

// ── Webhooks ──

export const CreateWebhookSchema = z.object({
  channel_id: Snowflake,
  name: z.string().min(1).max(80).describe("Webhook name"),
  reason: OptionalReason,
});

export const GetWebhookSchema = z.object({
  webhook_id: Snowflake,
});

export const GetChannelWebhooksSchema = z.object({
  channel_id: Snowflake,
});

export const GetGuildWebhooksSchema = z.object({
  guild_id: Snowflake,
});

export const ModifyWebhookSchema = z.object({
  webhook_id: Snowflake,
  name: z.string().min(1).max(80).optional(),
  channel_id: Snowflake.optional().describe("Move webhook to another channel"),
  reason: OptionalReason,
});

export const DeleteWebhookSchema = z.object({
  webhook_id: Snowflake,
  reason: OptionalReason,
});

export const ExecuteWebhookSchema = z.object({
  webhook_id: Snowflake,
  webhook_token: z.string(),
  content: z.string().max(2000).optional(),
  username: z.string().optional().describe("Override webhook username"),
  avatar_url: z.string().optional().describe("Override webhook avatar"),
  tts: z.boolean().optional(),
  embeds: z.array(z.record(z.unknown())).max(10).optional(),
  components: z.array(z.record(z.unknown())).max(5).optional(),
  flags: z.number().optional(),
  thread_id: Snowflake.optional().describe("Send to a thread in the webhook channel"),
  wait: z.boolean().optional().describe("Wait for message confirmation (returns message object)"),
});

export const GetWebhookMessageSchema = z.object({
  webhook_id: Snowflake,
  webhook_token: z.string(),
  message_id: Snowflake,
  thread_id: Snowflake.optional(),
});

export const EditWebhookMessageSchema = z.object({
  webhook_id: Snowflake,
  webhook_token: z.string(),
  message_id: Snowflake,
  content: z.string().max(2000).optional(),
  embeds: z.array(z.record(z.unknown())).max(10).optional(),
  components: z.array(z.record(z.unknown())).max(5).optional(),
  thread_id: Snowflake.optional(),
});

export const DeleteWebhookMessageSchema = z.object({
  webhook_id: Snowflake,
  webhook_token: z.string(),
  message_id: Snowflake,
  thread_id: Snowflake.optional(),
});

// ── Application Commands ──

export const ListCommandsSchema = z.object({
  application_id: Snowflake,
  guild_id: Snowflake.optional().describe("If provided, list guild-specific commands"),
  with_localizations: z.boolean().optional(),
});

export const CreateCommandSchema = z.object({
  application_id: Snowflake,
  guild_id: Snowflake.optional().describe("If provided, create guild-specific command"),
  name: z.string().min(1).max(32).describe("Command name (lowercase, no spaces)"),
  description: z.string().max(100).optional().describe("Command description (required for CHAT_INPUT)"),
  type: z.number().optional().describe("1=CHAT_INPUT, 2=USER, 3=MESSAGE"),
  options: z.array(z.record(z.unknown())).optional().describe("Command options/parameters"),
  default_member_permissions: z.string().optional().describe("Bitwise permissions required"),
  dm_permission: z.boolean().optional().describe("Can be used in DMs"),
  nsfw: z.boolean().optional(),
});

export const GetCommandSchema = z.object({
  application_id: Snowflake,
  command_id: Snowflake,
  guild_id: Snowflake.optional(),
});

export const ModifyCommandSchema = z.object({
  application_id: Snowflake,
  command_id: Snowflake,
  guild_id: Snowflake.optional(),
  name: z.string().min(1).max(32).optional(),
  description: z.string().max(100).optional(),
  options: z.array(z.record(z.unknown())).optional(),
  default_member_permissions: z.string().optional(),
  dm_permission: z.boolean().optional(),
  nsfw: z.boolean().optional(),
});

export const DeleteCommandSchema = z.object({
  application_id: Snowflake,
  command_id: Snowflake,
  guild_id: Snowflake.optional(),
});

export const BulkOverwriteCommandsSchema = z.object({
  application_id: Snowflake,
  guild_id: Snowflake.optional(),
  commands: z.array(z.record(z.unknown())).describe("Array of command objects to overwrite"),
});

// ── Interactions ──

export const CreateInteractionResponseSchema = z.object({
  interaction_id: Snowflake,
  interaction_token: z.string(),
  type: z
    .number()
    .describe("4=CHANNEL_MESSAGE, 5=DEFERRED_CHANNEL_MESSAGE, 6=DEFERRED_UPDATE, 7=UPDATE_MESSAGE, 9=MODAL"),
  data: z.record(z.unknown()).optional().describe("Response data (content, embeds, components, etc.)"),
});

export const GetOriginalResponseSchema = z.object({
  application_id: Snowflake,
  interaction_token: z.string(),
});

export const EditOriginalResponseSchema = z.object({
  application_id: Snowflake,
  interaction_token: z.string(),
  content: z.string().max(2000).optional(),
  embeds: z.array(z.record(z.unknown())).max(10).optional(),
  components: z.array(z.record(z.unknown())).max(5).optional(),
});

export const DeleteOriginalResponseSchema = z.object({
  application_id: Snowflake,
  interaction_token: z.string(),
});

export const CreateFollowupSchema = z.object({
  application_id: Snowflake,
  interaction_token: z.string(),
  content: z.string().max(2000).optional(),
  embeds: z.array(z.record(z.unknown())).max(10).optional(),
  components: z.array(z.record(z.unknown())).max(5).optional(),
  flags: z.number().optional(),
});

// ── Users ──

export const GetUserSchema = z.object({
  user_id: Snowflake,
});

export const CreateDMSchema = z.object({
  recipient_id: Snowflake,
});

// ── Emojis ──

export const ListEmojisSchema = z.object({
  guild_id: Snowflake,
});

export const GetEmojiSchema = z.object({
  guild_id: Snowflake,
  emoji_id: Snowflake,
});

export const CreateEmojiSchema = z.object({
  guild_id: Snowflake,
  name: z.string().min(2).max(32).describe("Emoji name"),
  image: z.string().describe("Base64-encoded image data (data:image/png;base64,...)"),
  roles: z.array(Snowflake).optional().describe("Roles allowed to use this emoji"),
  reason: OptionalReason,
});

export const ModifyEmojiSchema = z.object({
  guild_id: Snowflake,
  emoji_id: Snowflake,
  name: z.string().min(2).max(32).optional(),
  roles: z.array(Snowflake).optional(),
  reason: OptionalReason,
});

export const DeleteEmojiSchema = z.object({
  guild_id: Snowflake,
  emoji_id: Snowflake,
  reason: OptionalReason,
});

// ── Scheduled Events ──

export const ListEventsSchema = z.object({
  guild_id: Snowflake,
  with_user_count: z.boolean().optional(),
});

export const CreateEventSchema = z.object({
  guild_id: Snowflake,
  channel_id: Snowflake.optional().describe("Required for STAGE_INSTANCE and VOICE events"),
  entity_metadata: z
    .object({
      location: z.string().max(100).optional(),
    })
    .optional()
    .describe("Required for EXTERNAL events"),
  name: z.string().min(1).max(100),
  privacy_level: z.number().describe("2 = GUILD_ONLY"),
  scheduled_start_time: z.string().describe("ISO8601 timestamp"),
  scheduled_end_time: z.string().optional().describe("ISO8601 (required for EXTERNAL)"),
  description: z.string().max(1000).optional(),
  entity_type: z.number().describe("1=STAGE_INSTANCE, 2=VOICE, 3=EXTERNAL"),
  reason: OptionalReason,
});

export const GetEventSchema = z.object({
  guild_id: Snowflake,
  event_id: Snowflake,
  with_user_count: z.boolean().optional(),
});

export const ModifyEventSchema = z.object({
  guild_id: Snowflake,
  event_id: Snowflake,
  channel_id: Snowflake.optional(),
  entity_metadata: z.object({ location: z.string().max(100).optional() }).optional(),
  name: z.string().min(1).max(100).optional(),
  privacy_level: z.number().optional(),
  scheduled_start_time: z.string().optional(),
  scheduled_end_time: z.string().optional(),
  description: z.string().max(1000).optional(),
  entity_type: z.number().optional(),
  status: z.number().optional().describe("1=SCHEDULED, 2=ACTIVE, 3=COMPLETED, 4=CANCELED"),
  reason: OptionalReason,
});

export const DeleteEventSchema = z.object({
  guild_id: Snowflake,
  event_id: Snowflake,
});

export const GetEventUsersSchema = z.object({
  guild_id: Snowflake,
  event_id: Snowflake,
  limit: z.number().min(1).max(100).optional(),
  with_member: z.boolean().optional(),
  before: Snowflake.optional(),
  after: Snowflake.optional(),
});

// ── Auto Moderation ──

export const ListAutoModRulesSchema = z.object({
  guild_id: Snowflake,
});

export const GetAutoModRuleSchema = z.object({
  guild_id: Snowflake,
  rule_id: Snowflake,
});

export const CreateAutoModRuleSchema = z.object({
  guild_id: Snowflake,
  name: z.string().max(100),
  event_type: z.number().describe("1 = MESSAGE_SEND"),
  trigger_type: z.number().describe("1=KEYWORD, 3=SPAM, 4=KEYWORD_PRESET, 5=MENTION_SPAM, 6=MEMBER_PROFILE"),
  trigger_metadata: z.record(z.unknown()).optional(),
  actions: z.array(z.record(z.unknown())).describe("Actions to take when triggered"),
  enabled: z.boolean().optional(),
  exempt_roles: z.array(Snowflake).optional(),
  exempt_channels: z.array(Snowflake).optional(),
  reason: OptionalReason,
});

export const ModifyAutoModRuleSchema = z.object({
  guild_id: Snowflake,
  rule_id: Snowflake,
  name: z.string().max(100).optional(),
  event_type: z.number().optional(),
  trigger_metadata: z.record(z.unknown()).optional(),
  actions: z.array(z.record(z.unknown())).optional(),
  enabled: z.boolean().optional(),
  exempt_roles: z.array(Snowflake).optional(),
  exempt_channels: z.array(Snowflake).optional(),
  reason: OptionalReason,
});

export const DeleteAutoModRuleSchema = z.object({
  guild_id: Snowflake,
  rule_id: Snowflake,
  reason: OptionalReason,
});

// ── Audit Log ──

export const GetAuditLogSchema = z.object({
  guild_id: Snowflake,
  user_id: Snowflake.optional().describe("Filter by user who performed action"),
  action_type: z.number().optional().describe("Audit log action type"),
  before: Snowflake.optional(),
  after: Snowflake.optional(),
  limit: z.number().min(1).max(100).optional(),
});

// ── Invites ──

export const GetInviteSchema = z.object({
  invite_code: z.string(),
  with_counts: z.boolean().optional(),
  with_expiration: z.boolean().optional(),
  guild_scheduled_event_id: Snowflake.optional(),
});

export const DeleteInviteSchema = z.object({
  invite_code: z.string(),
  reason: OptionalReason,
});

// ── Prune ──

export const GetPruneCountSchema = z.object({
  guild_id: Snowflake,
  days: z.number().min(1).max(30).describe("Number of days of inactivity"),
  include_roles: z.array(Snowflake).optional(),
});

export const BeginPruneSchema = z.object({
  guild_id: Snowflake,
  days: z.number().min(1).max(30),
  compute_prune_count: z.boolean().optional().describe("Whether to return pruned count (discouraged for large guilds)"),
  include_roles: z.array(Snowflake).optional(),
  reason: OptionalReason,
});

// ── Raw API Call ──

export const RawApiCallSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
  path: z.string().describe("API path (e.g. '/guilds/123/stickers')"),
  body: z.record(z.unknown()).optional().describe("JSON body"),
  query: z.record(z.string()).optional().describe("Query parameters"),
  reason: z.string().optional().describe("Audit log reason"),
});
