/**
 * Zod schemas for YouTube Data API v3 MCP tool inputs.
 */
import { z } from "zod";

// ── Common ──

export const YouTubeId = z.string().describe("YouTube resource ID");
export const PageToken = z.string().optional().describe("Token for the next page of results");
export const MaxResults = z
  .number()
  .min(1)
  .max(50)
  .optional()
  .describe("Maximum number of items to return (1-50, default 5)");

const PartParam = (defaults: string) =>
  z.string().optional().describe(`Comma-separated resource parts (default: ${defaults})`);

// ── Videos ──

export const VideosListSchema = z.object({
  part: PartParam("snippet,contentDetails,statistics"),
  id: z.string().optional().describe("Comma-separated video IDs"),
  chart: z.enum(["mostPopular"]).optional().describe("Chart to retrieve (mostPopular)"),
  myRating: z.enum(["like", "dislike"]).optional().describe("Filter by the authenticated user's rating"),
  hl: z.string().optional().describe("Language for localised metadata"),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  maxResults: MaxResults,
  pageToken: PageToken,
  regionCode: z.string().optional().describe("ISO 3166-1 alpha-2 country code"),
  videoCategoryId: z.string().optional(),
  videoDuration: z.enum(["any", "long", "medium", "short"]).optional(),
  videoEmbeddable: z.enum(["any", "true"]).optional(),
  videoLicense: z.enum(["any", "creativeCommon", "youtube"]).optional(),
  videoType: z.enum(["any", "episode", "movie"]).optional(),
});

export const VideoSnippetSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  defaultLanguage: z.string().optional(),
  defaultAudioLanguage: z.string().optional(),
  localizations: z.record(z.object({ title: z.string(), description: z.string() })).optional(),
});

export const VideosInsertSchema = z.object({
  part: PartParam("snippet,status"),
  snippet: VideoSnippetSchema.optional(),
  status: z
    .object({
      privacyStatus: z.enum(["public", "private", "unlisted"]).optional(),
      selfDeclaredMadeForKids: z.boolean().optional(),
      publishAt: z.string().optional().describe("ISO 8601 datetime — schedules publish"),
    })
    .optional(),
  recordingDetails: z.record(z.unknown()).optional(),
  stabilize: z.boolean().optional(),
});

export const VideosUpdateSchema = z.object({
  id: YouTubeId.describe("Video ID to update"),
  part: PartParam("snippet,status"),
  snippet: VideoSnippetSchema.optional(),
  status: z
    .object({
      privacyStatus: z.enum(["public", "private", "unlisted"]).optional(),
      selfDeclaredMadeForKids: z.boolean().optional(),
      publishAt: z.string().optional(),
    })
    .optional(),
  localizations: z.record(z.object({ title: z.string(), description: z.string() })).optional(),
});

export const VideosDeleteSchema = z.object({
  id: YouTubeId.describe("Video ID to delete"),
  onBehalfOfContentOwner: z.string().optional(),
});

export const VideosRateSchema = z.object({
  id: YouTubeId.describe("Video ID to rate"),
  rating: z.enum(["like", "dislike", "none"]).describe("Rating to apply"),
});

export const VideosGetRatingSchema = z.object({
  id: z.string().describe("Comma-separated video IDs (max 50)"),
  onBehalfOfContentOwner: z.string().optional(),
});

// ── Channels ──

export const ChannelsListSchema = z.object({
  part: PartParam("snippet,contentDetails,statistics"),
  id: z.string().optional().describe("Comma-separated channel IDs"),
  forHandle: z.string().optional().describe("Channel handle (e.g. @handle)"),
  forUsername: z.string().optional().describe("YouTube username (legacy)"),
  mine: z.boolean().optional().describe("Return the authenticated user's channel"),
  managedByMe: z.boolean().optional(),
  maxResults: MaxResults,
  pageToken: PageToken,
  hl: z.string().optional(),
});

export const ChannelsUpdateSchema = z.object({
  id: YouTubeId.describe("Channel ID to update"),
  part: PartParam("snippet,brandingSettings"),
  snippet: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      defaultLanguage: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  brandingSettings: z.record(z.unknown()).optional(),
  localizations: z.record(z.unknown()).optional(),
  onBehalfOfContentOwner: z.string().optional(),
});

// ── Playlists ──

export const PlaylistsListSchema = z.object({
  part: PartParam("snippet,contentDetails"),
  id: z.string().optional().describe("Comma-separated playlist IDs"),
  channelId: z.string().optional(),
  mine: z.boolean().optional(),
  maxResults: MaxResults,
  pageToken: PageToken,
  hl: z.string().optional(),
});

export const PlaylistsInsertSchema = z.object({
  part: PartParam("snippet,status"),
  snippet: z.object({
    title: z.string().describe("Playlist title"),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    defaultLanguage: z.string().optional(),
  }),
  status: z
    .object({
      privacyStatus: z.enum(["public", "private", "unlisted"]).optional(),
    })
    .optional(),
  onBehalfOfContentOwner: z.string().optional(),
  onBehalfOfContentOwnerChannel: z.string().optional(),
});

export const PlaylistsUpdateSchema = z.object({
  id: YouTubeId.describe("Playlist ID to update"),
  part: PartParam("snippet,status"),
  snippet: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      defaultLanguage: z.string().optional(),
    })
    .optional(),
  status: z
    .object({
      privacyStatus: z.enum(["public", "private", "unlisted"]).optional(),
    })
    .optional(),
  localizations: z.record(z.unknown()).optional(),
  onBehalfOfContentOwner: z.string().optional(),
});

export const PlaylistsDeleteSchema = z.object({
  id: YouTubeId.describe("Playlist ID to delete"),
  onBehalfOfContentOwner: z.string().optional(),
});

// ── PlaylistItems ──

export const PlaylistItemsListSchema = z.object({
  part: PartParam("snippet,contentDetails"),
  playlistId: z.string().describe("Playlist ID"),
  id: z.string().optional().describe("Comma-separated playlistItem IDs"),
  maxResults: MaxResults,
  pageToken: PageToken,
  videoId: z.string().optional().describe("Filter by video ID"),
  onBehalfOfContentOwner: z.string().optional(),
});

export const PlaylistItemsInsertSchema = z.object({
  part: PartParam("snippet"),
  snippet: z.object({
    playlistId: z.string().describe("Target playlist ID"),
    resourceId: z.object({
      kind: z.string().describe("e.g. youtube#video"),
      videoId: z.string().optional(),
    }),
    position: z.number().optional().describe("Zero-based position in playlist"),
  }),
  onBehalfOfContentOwner: z.string().optional(),
});

export const PlaylistItemsUpdateSchema = z.object({
  id: YouTubeId.describe("PlaylistItem ID to update"),
  part: PartParam("snippet"),
  snippet: z.object({
    playlistId: z.string(),
    resourceId: z.object({
      kind: z.string(),
      videoId: z.string().optional(),
    }),
    position: z.number().optional(),
  }),
  onBehalfOfContentOwner: z.string().optional(),
});

export const PlaylistItemsDeleteSchema = z.object({
  id: YouTubeId.describe("PlaylistItem ID to delete"),
  onBehalfOfContentOwner: z.string().optional(),
});

// ── Comments ──

export const CommentsListSchema = z.object({
  part: PartParam("snippet"),
  id: z.string().optional().describe("Comma-separated comment IDs"),
  parentId: z.string().optional().describe("Parent comment ID (to list replies)"),
  maxResults: MaxResults,
  pageToken: PageToken,
  textFormat: z.enum(["html", "plainText"]).optional(),
});

export const CommentsInsertSchema = z.object({
  part: PartParam("snippet"),
  parentId: z.string().describe("Parent comment ID (thread topLevelComment.id or existing reply)"),
  textOriginal: z.string().describe("Comment text"),
});

export const CommentsUpdateSchema = z.object({
  id: YouTubeId.describe("Comment ID to update"),
  part: PartParam("snippet"),
  textOriginal: z.string().describe("Updated comment text"),
});

export const CommentsDeleteSchema = z.object({
  id: YouTubeId.describe("Comment ID to delete"),
});

export const CommentsSetModerationStatusSchema = z.object({
  id: z.string().describe("Comma-separated comment IDs"),
  moderationStatus: z.enum(["heldForReview", "published", "rejected"]).describe("New moderation status"),
  banAuthor: z.boolean().optional().describe("Ban the comment author from making future comments"),
});

// ── CommentThreads ──

export const CommentThreadsListSchema = z.object({
  part: PartParam("snippet,replies"),
  id: z.string().optional().describe("Comma-separated commentThread IDs"),
  allThreadsRelatedToChannelId: z.string().optional(),
  channelId: z.string().optional(),
  videoId: z.string().optional(),
  maxResults: MaxResults,
  pageToken: PageToken,
  moderationStatus: z.enum(["heldForReview", "likelySpam", "published"]).optional(),
  order: z.enum(["relevance", "time"]).optional(),
  searchTerms: z.string().optional(),
  textFormat: z.enum(["html", "plainText"]).optional(),
});

export const CommentThreadsInsertSchema = z.object({
  part: PartParam("snippet"),
  channelId: z.string().optional().describe("Channel to post to (channel comment)"),
  videoId: z.string().optional().describe("Video to comment on"),
  textOriginal: z.string().describe("Top-level comment text"),
});

// ── Search ──

export const SearchListSchema = z.object({
  part: PartParam("snippet"),
  q: z.string().optional().describe("Search query"),
  type: z.string().optional().describe("Comma-separated resource types: video,channel,playlist"),
  channelId: z.string().optional(),
  channelType: z.enum(["any", "show"]).optional(),
  eventType: z.enum(["completed", "live", "upcoming"]).optional(),
  forMine: z.boolean().optional().describe("Restrict to authenticated user's content"),
  forContentOwner: z.boolean().optional(),
  forDeveloper: z.boolean().optional(),
  location: z.string().optional().describe("Latitude,longitude (e.g. '37.42307,-122.08427')"),
  locationRadius: z.string().optional().describe("e.g. '1500m', '5km', '10000ft', '0.75mi'"),
  maxResults: MaxResults,
  order: z.enum(["date", "rating", "relevance", "title", "videoCount", "viewCount"]).optional(),
  pageToken: PageToken,
  publishedAfter: z.string().optional().describe("ISO 8601 datetime"),
  publishedBefore: z.string().optional().describe("ISO 8601 datetime"),
  regionCode: z.string().optional(),
  relevanceLanguage: z.string().optional(),
  safeSearch: z.enum(["moderate", "none", "strict"]).optional(),
  topicId: z.string().optional(),
  videoCaption: z.enum(["any", "closedCaption", "none"]).optional(),
  videoCategoryId: z.string().optional(),
  videoDefinition: z.enum(["any", "high", "standard"]).optional(),
  videoDimension: z.enum(["2d", "3d", "any"]).optional(),
  videoDuration: z.enum(["any", "long", "medium", "short"]).optional(),
  videoEmbeddable: z.enum(["any", "true"]).optional(),
  videoLicense: z.enum(["any", "creativeCommon", "youtube"]).optional(),
  videoSyndicated: z.enum(["any", "true"]).optional(),
  videoType: z.enum(["any", "episode", "movie"]).optional(),
});

// ── Captions ──

export const CaptionsListSchema = z.object({
  part: PartParam("snippet"),
  videoId: z.string().describe("Video ID"),
  id: z.string().optional().describe("Comma-separated caption track IDs"),
  onBehalfOfContentOwner: z.string().optional(),
});

export const CaptionsDeleteSchema = z.object({
  id: YouTubeId.describe("Caption track ID to delete"),
  onBehalfOfContentOwner: z.string().optional(),
});

// ── Subscriptions ──

export const SubscriptionsListSchema = z.object({
  part: PartParam("snippet,contentDetails"),
  id: z.string().optional().describe("Comma-separated subscription IDs"),
  channelId: z.string().optional().describe("Filter by channel being subscribed to"),
  forChannelId: z.string().optional().describe("Filter by subscribed-to channel IDs (comma-separated)"),
  mine: z.boolean().optional().describe("Return authenticated user's subscriptions"),
  myRecentSubscribers: z.boolean().optional(),
  mySubscribers: z.boolean().optional(),
  maxResults: MaxResults,
  order: z.enum(["alphabetical", "relevance", "unread"]).optional(),
  pageToken: PageToken,
});

export const SubscriptionsInsertSchema = z.object({
  part: PartParam("snippet"),
  channelId: z.string().describe("Channel ID to subscribe to"),
});

export const SubscriptionsDeleteSchema = z.object({
  id: YouTubeId.describe("Subscription ID to delete"),
});

// ── LiveBroadcasts ──

export const LiveBroadcastsListSchema = z.object({
  part: PartParam("snippet,contentDetails,status"),
  id: z.string().optional().describe("Comma-separated broadcast IDs"),
  broadcastStatus: z.enum(["active", "all", "completed", "upcoming"]).optional(),
  broadcastType: z.enum(["all", "event", "persistent"]).optional(),
  mine: z.boolean().optional(),
  maxResults: MaxResults,
  pageToken: PageToken,
  onBehalfOfContentOwner: z.string().optional(),
  onBehalfOfContentOwnerChannel: z.string().optional(),
});

export const LiveBroadcastsInsertSchema = z.object({
  part: PartParam("snippet,status,contentDetails"),
  snippet: z.object({
    title: z.string().describe("Broadcast title"),
    description: z.string().optional(),
    scheduledStartTime: z.string().describe("ISO 8601 datetime"),
    scheduledEndTime: z.string().optional().describe("ISO 8601 datetime"),
  }),
  status: z
    .object({
      privacyStatus: z.enum(["public", "private", "unlisted"]).optional(),
      selfDeclaredMadeForKids: z.boolean().optional(),
    })
    .optional(),
  contentDetails: z.record(z.unknown()).optional(),
  onBehalfOfContentOwner: z.string().optional(),
  onBehalfOfContentOwnerChannel: z.string().optional(),
});

export const LiveBroadcastsUpdateSchema = z.object({
  id: YouTubeId.describe("Broadcast ID to update"),
  part: PartParam("snippet,status,contentDetails"),
  snippet: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      scheduledStartTime: z.string().optional(),
      scheduledEndTime: z.string().optional(),
    })
    .optional(),
  status: z
    .object({
      privacyStatus: z.enum(["public", "private", "unlisted"]).optional(),
      selfDeclaredMadeForKids: z.boolean().optional(),
    })
    .optional(),
  contentDetails: z.record(z.unknown()).optional(),
  onBehalfOfContentOwner: z.string().optional(),
});

export const LiveBroadcastsDeleteSchema = z.object({
  id: YouTubeId.describe("Broadcast ID to delete"),
  onBehalfOfContentOwner: z.string().optional(),
});

export const LiveBroadcastsBindSchema = z.object({
  id: YouTubeId.describe("Broadcast ID"),
  part: PartParam("id,contentDetails"),
  streamId: z.string().optional().describe("Live stream ID to bind (omit to unbind)"),
  onBehalfOfContentOwner: z.string().optional(),
  onBehalfOfContentOwnerChannel: z.string().optional(),
});

export const LiveBroadcastsTransitionSchema = z.object({
  id: YouTubeId.describe("Broadcast ID"),
  broadcastStatus: z.enum(["complete", "live", "testing"]).describe("Target status"),
  part: PartParam("id,status"),
  onBehalfOfContentOwner: z.string().optional(),
  onBehalfOfContentOwnerChannel: z.string().optional(),
});

// ── LiveStreams ──

export const LiveStreamsListSchema = z.object({
  part: PartParam("snippet,cdn,status"),
  id: z.string().optional().describe("Comma-separated stream IDs"),
  mine: z.boolean().optional(),
  maxResults: MaxResults,
  pageToken: PageToken,
  onBehalfOfContentOwner: z.string().optional(),
  onBehalfOfContentOwnerChannel: z.string().optional(),
});

export const LiveStreamsInsertSchema = z.object({
  part: PartParam("snippet,cdn"),
  snippet: z.object({
    title: z.string().describe("Stream title"),
    description: z.string().optional(),
  }),
  cdn: z
    .object({
      frameRate: z.enum(["30fps", "60fps", "variable"]).optional(),
      ingestionType: z.enum(["dash", "rtmp", "webRTC"]).optional(),
      resolution: z.enum(["1080p", "1440p", "2160p", "240p", "360p", "480p", "720p", "variable"]).optional(),
    })
    .optional(),
  contentDetails: z.record(z.unknown()).optional(),
  onBehalfOfContentOwner: z.string().optional(),
  onBehalfOfContentOwnerChannel: z.string().optional(),
});

export const LiveStreamsUpdateSchema = z.object({
  id: YouTubeId.describe("Stream ID to update"),
  part: PartParam("snippet,cdn"),
  snippet: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  cdn: z.record(z.unknown()).optional(),
  contentDetails: z.record(z.unknown()).optional(),
  onBehalfOfContentOwner: z.string().optional(),
});

export const LiveStreamsDeleteSchema = z.object({
  id: YouTubeId.describe("Stream ID to delete"),
  onBehalfOfContentOwner: z.string().optional(),
});

// ── LiveChatMessages ──

export const LiveChatMessagesListSchema = z.object({
  part: PartParam("snippet,authorDetails"),
  liveChatId: z.string().describe("Live chat ID"),
  maxResults: z.number().min(200).max(2000).optional().describe("Max results (200-2000)"),
  pageToken: PageToken,
  profileImageSize: z.number().optional(),
  hl: z.string().optional(),
});

export const LiveChatMessagesInsertSchema = z.object({
  part: PartParam("snippet"),
  liveChatId: z.string().describe("Live chat ID"),
  type: z.enum(["textMessageEvent", "superChatEvent"]).optional().describe("Message type (default textMessageEvent)"),
  messageText: z.string().describe("Message text"),
});

export const LiveChatMessagesDeleteSchema = z.object({
  id: YouTubeId.describe("Live chat message ID to delete"),
});

// ── LiveChatModerators ──

export const LiveChatModeratorsListSchema = z.object({
  part: PartParam("snippet"),
  liveChatId: z.string().describe("Live chat ID"),
  maxResults: MaxResults,
  pageToken: PageToken,
});

export const LiveChatModeratorsInsertSchema = z.object({
  part: PartParam("snippet"),
  liveChatId: z.string().describe("Live chat ID"),
  channelId: z.string().describe("Channel ID to make moderator"),
});

export const LiveChatModeratorsDeleteSchema = z.object({
  id: YouTubeId.describe("Moderator ID to remove"),
});

// ── LiveChatBans ──

export const LiveChatBansInsertSchema = z.object({
  part: PartParam("snippet"),
  liveChatId: z.string().describe("Live chat ID"),
  channelId: z.string().describe("Channel ID to ban"),
  type: z.enum(["permanent", "temporary"]).describe("Ban type"),
  banDurationSeconds: z.number().optional().describe("Duration in seconds (required for temporary bans)"),
});

export const LiveChatBansDeleteSchema = z.object({
  id: YouTubeId.describe("Ban ID to remove"),
});

// ── Raw API Call ──

export const RawApiCallSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
  path: z.string().describe("API path (e.g. '/videoCategories')"),
  body: z.record(z.unknown()).optional().describe("JSON body for POST/PUT/PATCH"),
  query: z
    .record(z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .describe("Query parameters"),
});
