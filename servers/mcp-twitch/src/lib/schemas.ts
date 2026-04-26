/**
 * Zod schemas for Twitch MCP tool inputs.
 */
import { z } from "zod";

// ── Common ──

export const BroadcasterId = z.string().describe("Broadcaster's Twitch user ID");
export const UserId = z.string().describe("Twitch user ID");
export const OptionalCursor = z.string().optional().describe("Pagination cursor");

// ── Channels ──

export const GetChannelInfoSchema = z.object({
  broadcaster_id: z.union([z.string(), z.array(z.string()).max(100)]).describe("One or more broadcaster IDs"),
});

export const ModifyChannelSchema = z.object({
  broadcaster_id: BroadcasterId,
  game_id: z.string().optional().describe("Game/category ID"),
  title: z.string().max(140).optional().describe("Stream title"),
  broadcaster_language: z.string().optional().describe("ISO 639-1 language code"),
  tags: z.array(z.string()).max(10).optional().describe("Stream tags (max 10, free-form)"),
  content_classification_labels: z
    .array(
      z.object({
        id: z.string(),
        is_enabled: z.boolean(),
      }),
    )
    .optional()
    .describe("Content classification labels"),
  is_branded_content: z.boolean().optional(),
});

export const GetChannelEditorsSchema = z.object({
  broadcaster_id: BroadcasterId,
});

export const GetChannelFollowersSchema = z.object({
  broadcaster_id: BroadcasterId,
  user_id: UserId.optional().describe("Check if specific user follows"),
  first: z.number().min(1).max(100).optional(),
  after: OptionalCursor,
});

export const GetFollowedChannelsSchema = z.object({
  user_id: UserId,
  broadcaster_id: BroadcasterId.optional().describe("Check if following specific channel"),
  first: z.number().min(1).max(100).optional(),
  after: OptionalCursor,
});

// ── Chat ──

export const GetChattersSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId.describe("Moderator's user ID (must match token)"),
  first: z.number().min(1).max(1000).optional(),
  after: OptionalCursor,
});

export const GetEmotesSchema = z.object({
  broadcaster_id: BroadcasterId,
});

export const GetChatSettingsSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId.optional(),
});

export const UpdateChatSettingsSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId,
  emote_mode: z.boolean().optional(),
  follower_mode: z.boolean().optional(),
  follower_mode_duration: z.number().min(0).max(129600).optional().describe("Minutes (0 = no restriction)"),
  slow_mode: z.boolean().optional(),
  slow_mode_wait_time: z.number().min(3).max(120).optional().describe("Seconds between messages"),
  subscriber_mode: z.boolean().optional(),
  unique_chat_mode: z.boolean().optional(),
  non_moderator_chat_delay: z.boolean().optional(),
  non_moderator_chat_delay_duration: z.number().optional().describe("2, 4, or 6 seconds"),
});

export const SendChatAnnouncementSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId,
  message: z.string().max(500),
  color: z.enum(["blue", "green", "orange", "purple", "primary"]).optional(),
});

export const SendShoutoutSchema = z.object({
  from_broadcaster_id: BroadcasterId,
  to_broadcaster_id: BroadcasterId,
  moderator_id: UserId,
});

export const SendChatMessageSchema = z.object({
  broadcaster_id: BroadcasterId,
  sender_id: UserId.describe("Sender user ID (must match token)"),
  message: z.string().max(500),
  reply_parent_message_id: z.string().optional().describe("Message ID to reply to"),
});

export const DeleteChatMessageSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId,
  message_id: z.string().optional().describe("Specific message ID (omit to clear all)"),
});

export const GetChatColorSchema = z.object({
  user_id: z.union([z.string(), z.array(z.string()).max(100)]),
});

export const UpdateChatColorSchema = z.object({
  user_id: UserId,
  color: z.string().describe("Named color or hex (#RRGGBB, Turbo/Prime only)"),
});

export const GetVIPsSchema = z.object({
  broadcaster_id: BroadcasterId,
  user_id: UserId.optional(),
  first: z.number().min(1).max(100).optional(),
  after: OptionalCursor,
});

export const AddRemoveVIPSchema = z.object({
  broadcaster_id: BroadcasterId,
  user_id: UserId,
});

// ── Moderation ──

export const GetBannedUsersSchema = z.object({
  broadcaster_id: BroadcasterId,
  user_id: z.union([z.string(), z.array(z.string()).max(100)]).optional(),
  first: z.number().min(1).max(100).optional(),
  after: OptionalCursor,
  before: OptionalCursor,
});

export const BanUserSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId,
  user_id: UserId.describe("User to ban/timeout"),
  duration: z.number().min(1).max(1209600).optional().describe("Timeout duration in seconds (omit for permanent ban)"),
  reason: z.string().max(500).optional(),
});

export const UnbanUserSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId,
  user_id: UserId,
});

export const GetBlockedTermsSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId,
  first: z.number().min(1).max(100).optional(),
  after: OptionalCursor,
});

export const AddBlockedTermSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId,
  text: z.string().min(2).max(500).describe("Term to block"),
});

export const RemoveBlockedTermSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId,
  id: z.string().describe("Blocked term ID"),
});

export const GetModeratorsSchema = z.object({
  broadcaster_id: BroadcasterId,
  user_id: z.union([z.string(), z.array(z.string()).max(100)]).optional(),
  first: z.number().min(1).max(100).optional(),
  after: OptionalCursor,
});

export const AddRemoveModeratorSchema = z.object({
  broadcaster_id: BroadcasterId,
  user_id: UserId,
});

export const GetShieldModeSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId,
});

export const UpdateShieldModeSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId,
  is_active: z.boolean(),
});

export const GetAutoModSettingsSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId,
});

export const UpdateAutoModSettingsSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId,
  overall_level: z.number().min(0).max(4).optional().describe("0=off, 4=max filtering"),
  aggression: z.number().min(0).max(4).optional(),
  bullying: z.number().min(0).max(4).optional(),
  disability: z.number().min(0).max(4).optional(),
  misogyny: z.number().min(0).max(4).optional(),
  race_ethnicity_or_religion: z.number().min(0).max(4).optional(),
  sex_based_terms: z.number().min(0).max(4).optional(),
  sexuality_sex_or_gender: z.number().min(0).max(4).optional(),
  swearing: z.number().min(0).max(4).optional(),
});

export const WarnUserSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId,
  user_id: UserId,
  reason: z.string().max(500),
});

export const GetUnbanRequestsSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId,
  status: z.enum(["pending", "approved", "denied", "acknowledged", "canceled"]).optional(),
  user_id: UserId.optional(),
  first: z.number().min(1).max(100).optional(),
  after: OptionalCursor,
});

export const ResolveUnbanRequestSchema = z.object({
  broadcaster_id: BroadcasterId,
  moderator_id: UserId,
  unban_request_id: z.string(),
  status: z.enum(["approved", "denied"]),
  resolution_text: z.string().max(500).optional(),
});

// ── Streams ──

export const GetStreamsSchema = z.object({
  user_id: z.union([z.string(), z.array(z.string()).max(100)]).optional(),
  user_login: z.union([z.string(), z.array(z.string()).max(100)]).optional(),
  game_id: z.union([z.string(), z.array(z.string()).max(100)]).optional(),
  type: z.enum(["all", "live"]).optional(),
  language: z.union([z.string(), z.array(z.string()).max(100)]).optional(),
  first: z.number().min(1).max(100).optional(),
  before: OptionalCursor,
  after: OptionalCursor,
});

export const GetFollowedStreamsSchema = z.object({
  user_id: UserId,
  first: z.number().min(1).max(100).optional(),
  after: OptionalCursor,
});

export const CreateStreamMarkerSchema = z.object({
  user_id: UserId.describe("Broadcaster's user ID"),
  description: z.string().max(140).optional(),
});

export const GetStreamMarkersSchema = z.object({
  user_id: UserId.optional().describe("Broadcaster's user ID"),
  video_id: z.string().optional().describe("Video/VOD ID"),
  first: z.number().min(1).max(100).optional(),
  after: OptionalCursor,
});

export const GetStreamKeySchema = z.object({
  broadcaster_id: BroadcasterId,
});

// ── Channel Points ──

export const GetCustomRewardsSchema = z.object({
  broadcaster_id: BroadcasterId,
  id: z.union([z.string(), z.array(z.string()).max(50)]).optional(),
  only_manageable_rewards: z.boolean().optional(),
});

export const CreateCustomRewardSchema = z.object({
  broadcaster_id: BroadcasterId,
  title: z.string().min(1).max(45),
  cost: z.number().min(1),
  prompt: z.string().max(200).optional(),
  is_enabled: z.boolean().optional(),
  background_color: z.string().optional().describe("Hex color (#RRGGBB)"),
  is_user_input_required: z.boolean().optional(),
  is_max_per_stream_enabled: z.boolean().optional(),
  max_per_stream: z.number().optional(),
  is_max_per_user_per_stream_enabled: z.boolean().optional(),
  max_per_user_per_stream: z.number().optional(),
  is_global_cooldown_enabled: z.boolean().optional(),
  global_cooldown_seconds: z.number().optional(),
  should_redemptions_skip_request_queue: z.boolean().optional(),
});

export const UpdateCustomRewardSchema = z.object({
  broadcaster_id: BroadcasterId,
  id: z.string().describe("Reward ID"),
  title: z.string().min(1).max(45).optional(),
  cost: z.number().min(1).optional(),
  prompt: z.string().max(200).optional(),
  is_enabled: z.boolean().optional(),
  is_paused: z.boolean().optional(),
  background_color: z.string().optional(),
  is_user_input_required: z.boolean().optional(),
  is_max_per_stream_enabled: z.boolean().optional(),
  max_per_stream: z.number().optional(),
  is_max_per_user_per_stream_enabled: z.boolean().optional(),
  max_per_user_per_stream: z.number().optional(),
  is_global_cooldown_enabled: z.boolean().optional(),
  global_cooldown_seconds: z.number().optional(),
  should_redemptions_skip_request_queue: z.boolean().optional(),
});

export const DeleteCustomRewardSchema = z.object({
  broadcaster_id: BroadcasterId,
  id: z.string().describe("Reward ID"),
});

export const GetRedemptionsSchema = z.object({
  broadcaster_id: BroadcasterId,
  reward_id: z.string(),
  status: z.enum(["UNFULFILLED", "FULFILLED", "CANCELED"]).optional(),
  id: z.union([z.string(), z.array(z.string()).max(50)]).optional(),
  sort: z.enum(["OLDEST", "NEWEST"]).optional(),
  first: z.number().min(1).max(50).optional(),
  after: OptionalCursor,
});

export const UpdateRedemptionStatusSchema = z.object({
  broadcaster_id: BroadcasterId,
  reward_id: z.string(),
  id: z.union([z.string(), z.array(z.string()).max(50)]).describe("Redemption IDs"),
  status: z.enum(["FULFILLED", "CANCELED"]),
});

// ── Polls ──

export const GetPollsSchema = z.object({
  broadcaster_id: BroadcasterId,
  id: z.union([z.string(), z.array(z.string()).max(20)]).optional(),
  first: z.number().min(1).max(20).optional(),
  after: OptionalCursor,
});

export const CreatePollSchema = z.object({
  broadcaster_id: BroadcasterId,
  title: z.string().min(1).max(60),
  choices: z
    .array(z.object({ title: z.string().min(1).max(25) }))
    .min(2)
    .max(5),
  duration: z.number().min(15).max(1800).describe("Duration in seconds (15-1800)"),
  channel_points_voting_enabled: z.boolean().optional(),
  channel_points_per_vote: z.number().min(1).max(1000000).optional(),
});

export const EndPollSchema = z.object({
  broadcaster_id: BroadcasterId,
  id: z.string().describe("Poll ID"),
  status: z.enum(["TERMINATED", "ARCHIVED"]),
});

// ── Predictions ──

export const GetPredictionsSchema = z.object({
  broadcaster_id: BroadcasterId,
  id: z.union([z.string(), z.array(z.string()).max(20)]).optional(),
  first: z.number().min(1).max(20).optional(),
  after: OptionalCursor,
});

export const CreatePredictionSchema = z.object({
  broadcaster_id: BroadcasterId,
  title: z.string().min(1).max(45),
  outcomes: z
    .array(z.object({ title: z.string().min(1).max(25) }))
    .min(2)
    .max(10),
  prediction_window: z.number().min(30).max(1800).describe("Seconds users can make predictions"),
});

export const EndPredictionSchema = z.object({
  broadcaster_id: BroadcasterId,
  id: z.string().describe("Prediction ID"),
  status: z.enum(["RESOLVED", "CANCELED", "LOCKED"]),
  winning_outcome_id: z.string().optional().describe("Required when status=RESOLVED"),
});

// ── Clips ──

export const CreateClipSchema = z.object({
  broadcaster_id: BroadcasterId,
  has_delay: z.boolean().optional().describe("Add intentional delay for highlight reel"),
});

export const GetClipsSchema = z.object({
  broadcaster_id: BroadcasterId.optional(),
  game_id: z.string().optional(),
  id: z.union([z.string(), z.array(z.string()).max(100)]).optional(),
  started_at: z.string().optional().describe("RFC3339 timestamp"),
  ended_at: z.string().optional().describe("RFC3339 timestamp"),
  first: z.number().min(1).max(100).optional(),
  before: OptionalCursor,
  after: OptionalCursor,
  is_featured: z.boolean().optional(),
});

// ── Schedule ──

export const GetScheduleSchema = z.object({
  broadcaster_id: BroadcasterId,
  id: z
    .union([z.string(), z.array(z.string()).max(100)])
    .optional()
    .describe("Segment IDs"),
  start_time: z.string().optional().describe("RFC3339 timestamp"),
  first: z.number().min(1).max(25).optional(),
  after: OptionalCursor,
});

export const CreateScheduleSegmentSchema = z.object({
  broadcaster_id: BroadcasterId,
  start_time: z.string().describe("RFC3339 timestamp"),
  timezone: z.string().describe("IANA timezone (e.g. 'Europe/Madrid')"),
  duration: z.string().optional().describe("Duration in minutes (default 240)"),
  is_recurring: z.boolean().optional(),
  category_id: z.string().optional().describe("Game/category ID"),
  title: z.string().max(140).optional(),
});

export const UpdateScheduleSegmentSchema = z.object({
  broadcaster_id: BroadcasterId,
  id: z.string().describe("Segment ID"),
  start_time: z.string().optional(),
  timezone: z.string().optional(),
  duration: z.string().optional(),
  is_canceled: z.boolean().optional(),
  category_id: z.string().optional(),
  title: z.string().max(140).optional(),
});

export const DeleteScheduleSegmentSchema = z.object({
  broadcaster_id: BroadcasterId,
  id: z.string().describe("Segment ID"),
});

// ── Raids ──

export const StartRaidSchema = z.object({
  from_broadcaster_id: BroadcasterId,
  to_broadcaster_id: BroadcasterId,
});

export const CancelRaidSchema = z.object({
  broadcaster_id: BroadcasterId,
});

// ── Ads ──

export const StartCommercialSchema = z.object({
  broadcaster_id: BroadcasterId,
  length: z.number().describe("Commercial length: 30, 60, 90, 120, 150, or 180 seconds"),
});

export const GetAdScheduleSchema = z.object({
  broadcaster_id: BroadcasterId,
});

export const SnoozeAdSchema = z.object({
  broadcaster_id: BroadcasterId,
});

// ── Search ──

export const SearchCategoriesSchema = z.object({
  query: z.string().describe("Search query"),
  first: z.number().min(1).max(100).optional(),
  after: OptionalCursor,
});

export const SearchChannelsSchema = z.object({
  query: z.string().describe("Search query"),
  live_only: z.boolean().optional(),
  first: z.number().min(1).max(100).optional(),
  after: OptionalCursor,
});

// ── Users ──

export const GetUsersSchema = z.object({
  id: z.union([z.string(), z.array(z.string()).max(100)]).optional(),
  login: z.union([z.string(), z.array(z.string()).max(100)]).optional(),
});

export const UpdateUserSchema = z.object({
  description: z.string().max(300).optional(),
});

export const GetUserBlocksSchema = z.object({
  broadcaster_id: BroadcasterId,
  first: z.number().min(1).max(100).optional(),
  after: OptionalCursor,
});

export const BlockUnblockUserSchema = z.object({
  target_user_id: UserId,
  source_context: z.enum(["chat", "whisper"]).optional(),
  reason: z.enum(["harassment", "spam", "other"]).optional(),
});

// ── Subscriptions ──

export const GetSubscriptionsSchema = z.object({
  broadcaster_id: BroadcasterId,
  user_id: z.union([z.string(), z.array(z.string()).max(100)]).optional(),
  first: z.number().min(1).max(100).optional(),
  after: OptionalCursor,
});

export const CheckUserSubSchema = z.object({
  broadcaster_id: BroadcasterId,
  user_id: UserId,
});

// ── Videos ──

export const GetVideosSchema = z.object({
  id: z.union([z.string(), z.array(z.string()).max(100)]).optional(),
  user_id: UserId.optional(),
  game_id: z.string().optional(),
  language: z.string().optional(),
  period: z.enum(["all", "day", "week", "month"]).optional(),
  sort: z.enum(["time", "trending", "views"]).optional(),
  type: z.enum(["all", "upload", "archive", "highlight"]).optional(),
  first: z.number().min(1).max(100).optional(),
  before: OptionalCursor,
  after: OptionalCursor,
});

export const DeleteVideosSchema = z.object({
  id: z.union([z.string(), z.array(z.string()).max(5)]).describe("Video IDs to delete (max 5)"),
});

// ── Whispers ──

export const SendWhisperSchema = z.object({
  from_user_id: UserId,
  to_user_id: UserId,
  message: z.string().max(500),
});

// ── EventSub ──

export const CreateEventSubSchema = z.object({
  type: z.string().describe("Subscription type (e.g. 'stream.online')"),
  version: z.string().describe("Subscription version (e.g. '1')"),
  condition: z.record(z.unknown()).describe("Subscription condition"),
  transport: z.object({
    method: z.enum(["webhook", "websocket", "conduit"]),
    callback: z.string().optional().describe("Webhook callback URL"),
    secret: z.string().optional().describe("Webhook secret"),
    session_id: z.string().optional().describe("WebSocket session ID"),
    conduit_id: z.string().optional().describe("Conduit ID"),
  }),
});

export const GetEventSubSchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  user_id: UserId.optional(),
  after: OptionalCursor,
});

export const DeleteEventSubSchema = z.object({
  id: z.string().describe("Subscription ID"),
});

// ── Games ──

export const GetGamesSchema = z.object({
  id: z.union([z.string(), z.array(z.string()).max(100)]).optional(),
  name: z.union([z.string(), z.array(z.string()).max(100)]).optional(),
  igdb_id: z.union([z.string(), z.array(z.string()).max(100)]).optional(),
});

export const GetTopGamesSchema = z.object({
  first: z.number().min(1).max(100).optional(),
  before: OptionalCursor,
  after: OptionalCursor,
});

// ── Raw ──

export const RawApiCallSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
  path: z.string().describe("API path (e.g. '/charity/campaigns')"),
  body: z.record(z.unknown()).optional().describe("JSON body"),
  query: z
    .record(z.union([z.string(), z.array(z.string())]))
    .optional()
    .describe("Query parameters"),
});
