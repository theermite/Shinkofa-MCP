/**
 * Zod schemas for Gmail MCP tool inputs.
 */
import { z } from "zod";

// ── Common ──

export const UserId = z.string().default("me").describe("Gmail user ID — use 'me' for the authenticated user");

export const MessageId = z.string().describe("Gmail message ID");
export const ThreadId = z.string().describe("Gmail thread ID");
export const DraftId = z.string().describe("Gmail draft ID");
export const LabelId = z.string().describe("Gmail label ID");

// ── Messages ──

export const ListMessagesSchema = z.object({
  userId: UserId,
  maxResults: z.number().min(1).max(500).optional().describe("Max messages to return (1-500)"),
  pageToken: z.string().optional().describe("Pagination token from previous response"),
  q: z.string().optional().describe("Gmail search query (same syntax as Gmail search box)"),
  labelIds: z.array(z.string()).optional().describe("Only return messages with all of these label IDs"),
  includeSpamTrash: z.boolean().optional().describe("Include messages from SPAM and TRASH"),
});

export const GetMessageSchema = z.object({
  userId: UserId,
  id: MessageId,
  format: z.enum(["minimal", "full", "raw", "metadata"]).optional().describe("Message format (default: full)"),
  metadataHeaders: z.array(z.string()).optional().describe("Headers to include when format=metadata"),
});

export const SendMessageSchema = z.object({
  userId: UserId,
  to: z.string().describe("Recipient email address(es), comma-separated"),
  subject: z.string().describe("Email subject"),
  body: z.string().describe("Email body (plain text or HTML)"),
  cc: z.string().optional().describe("CC recipient(s), comma-separated"),
  bcc: z.string().optional().describe("BCC recipient(s), comma-separated"),
  replyTo: z.string().optional().describe("Reply-To header value"),
  inReplyTo: z.string().optional().describe("Message-ID to reply to (for threading)"),
  references: z.string().optional().describe("References header for threading"),
  isHtml: z.boolean().optional().default(false).describe("Set true if body is HTML"),
  threadId: ThreadId.optional().describe("Thread ID to add message to"),
});

export const DeleteMessageSchema = z.object({
  userId: UserId,
  id: MessageId.describe("Message ID to permanently delete"),
});

export const TrashMessageSchema = z.object({
  userId: UserId,
  id: MessageId.describe("Message ID to move to Trash"),
});

export const UntrashMessageSchema = z.object({
  userId: UserId,
  id: MessageId.describe("Message ID to restore from Trash"),
});

export const ModifyMessageSchema = z.object({
  userId: UserId,
  id: MessageId,
  addLabelIds: z.array(z.string()).optional().describe("Label IDs to add"),
  removeLabelIds: z.array(z.string()).optional().describe("Label IDs to remove"),
});

export const BatchModifyMessagesSchema = z.object({
  userId: UserId,
  ids: z.array(MessageId).min(1).max(1000).describe("Message IDs to modify (max 1000)"),
  addLabelIds: z.array(z.string()).optional().describe("Label IDs to add"),
  removeLabelIds: z.array(z.string()).optional().describe("Label IDs to remove"),
});

export const BatchDeleteMessagesSchema = z.object({
  userId: UserId,
  ids: z.array(MessageId).min(1).max(1000).describe("Message IDs to permanently delete (max 1000)"),
});

export const GetAttachmentSchema = z.object({
  userId: UserId,
  messageId: MessageId.describe("Message ID containing the attachment"),
  attachmentId: z.string().describe("Attachment ID from the message parts"),
});

// ── Drafts ──

export const ListDraftsSchema = z.object({
  userId: UserId,
  maxResults: z.number().min(1).max(500).optional().describe("Max drafts to return"),
  pageToken: z.string().optional().describe("Pagination token"),
  q: z.string().optional().describe("Gmail search query to filter drafts"),
  includeSpamTrash: z.boolean().optional().describe("Include drafts from SPAM and TRASH"),
});

export const GetDraftSchema = z.object({
  userId: UserId,
  id: DraftId,
  format: z.enum(["minimal", "full", "raw", "metadata"]).optional().describe("Message format"),
});

export const CreateDraftSchema = z.object({
  userId: UserId,
  to: z.string().describe("Recipient email address(es), comma-separated"),
  subject: z.string().describe("Email subject"),
  body: z.string().describe("Email body (plain text or HTML)"),
  cc: z.string().optional().describe("CC recipient(s), comma-separated"),
  bcc: z.string().optional().describe("BCC recipient(s), comma-separated"),
  replyTo: z.string().optional().describe("Reply-To header value"),
  inReplyTo: z.string().optional().describe("Message-ID to reply to"),
  references: z.string().optional().describe("References header for threading"),
  isHtml: z.boolean().optional().default(false).describe("Set true if body is HTML"),
  threadId: ThreadId.optional().describe("Thread ID to associate draft with"),
});

export const UpdateDraftSchema = z.object({
  userId: UserId,
  id: DraftId,
  to: z.string().describe("Recipient email address(es), comma-separated"),
  subject: z.string().describe("Email subject"),
  body: z.string().describe("Email body (plain text or HTML)"),
  cc: z.string().optional().describe("CC recipients (comma-separated emails)"),
  bcc: z.string().optional().describe("BCC recipients (comma-separated emails)"),
  replyTo: z.string().optional().describe("Reply-To email address"),
  inReplyTo: z.string().optional().describe("Message-ID being replied to"),
  references: z.string().optional().describe("References header for threading"),
  isHtml: z.boolean().optional().default(false).describe("Set true if body contains HTML"),
  threadId: ThreadId.optional().describe("Thread ID to associate draft with"),
});

export const DeleteDraftSchema = z.object({
  userId: UserId,
  id: DraftId,
});

export const SendDraftSchema = z.object({
  userId: UserId,
  id: DraftId.describe("Draft ID to send"),
});

// ── Labels ──

export const ListLabelsSchema = z.object({
  userId: UserId,
});

export const GetLabelSchema = z.object({
  userId: UserId,
  id: LabelId,
});

export const CreateLabelSchema = z.object({
  userId: UserId,
  name: z.string().describe("Label display name"),
  labelListVisibility: z
    .enum(["labelShow", "labelShowIfUnread", "labelHide"])
    .optional()
    .describe("Visibility in label list"),
  messageListVisibility: z.enum(["show", "hide"]).optional().describe("Visibility in message list"),
  color: z
    .object({
      textColor: z.string().describe("Hex color for text (e.g. '#ffffff')"),
      backgroundColor: z.string().describe("Hex color for background"),
    })
    .optional()
    .describe("Label color"),
});

export const UpdateLabelSchema = z.object({
  userId: UserId,
  id: LabelId,
  name: z.string().optional().describe("New label display name"),
  labelListVisibility: z
    .enum(["labelShow", "labelShowIfUnread", "labelHide"])
    .optional()
    .describe("Visibility in label list: labelShow, labelShowIfUnread, or labelHide"),
  messageListVisibility: z.enum(["show", "hide"]).optional().describe("Visibility in message list: show or hide"),
  color: z
    .object({
      textColor: z.string().describe("Hex color for label text (e.g. '#000000')"),
      backgroundColor: z.string().describe("Hex color for label background (e.g. '#ffffff')"),
    })
    .optional()
    .describe("Label color with textColor and backgroundColor"),
});

export const DeleteLabelSchema = z.object({
  userId: UserId,
  id: LabelId,
});

// ── Threads ──

export const ListThreadsSchema = z.object({
  userId: UserId,
  maxResults: z.number().min(1).max(500).optional().describe("Max threads to return"),
  pageToken: z.string().optional().describe("Pagination token"),
  q: z.string().optional().describe("Gmail search query"),
  labelIds: z.array(z.string()).optional().describe("Filter by label IDs"),
  includeSpamTrash: z.boolean().optional().describe("Include threads from SPAM and TRASH"),
});

export const GetThreadSchema = z.object({
  userId: UserId,
  id: ThreadId,
  format: z.enum(["minimal", "full", "metadata"]).optional().describe("Thread format"),
  metadataHeaders: z.array(z.string()).optional().describe("Headers to include when format=metadata"),
});

export const ModifyThreadSchema = z.object({
  userId: UserId,
  id: ThreadId,
  addLabelIds: z.array(z.string()).optional().describe("Label IDs to add"),
  removeLabelIds: z.array(z.string()).optional().describe("Label IDs to remove"),
});

export const TrashThreadSchema = z.object({
  userId: UserId,
  id: ThreadId,
});

export const UntrashThreadSchema = z.object({
  userId: UserId,
  id: ThreadId,
});

export const DeleteThreadSchema = z.object({
  userId: UserId,
  id: ThreadId,
});

// ── History ──

export const ListHistorySchema = z.object({
  userId: UserId,
  startHistoryId: z.string().describe("Required. Only return histories after this ID"),
  maxResults: z.number().min(1).max(500).optional(),
  pageToken: z.string().optional(),
  labelId: z.string().optional().describe("Filter by label ID"),
  historyTypes: z
    .array(z.enum(["messageAdded", "messageDeleted", "labelAdded", "labelRemoved"]))
    .optional()
    .describe("History types to filter"),
});

// ── Profile ──

export const GetProfileSchema = z.object({
  userId: UserId,
});

// ── Settings ──

export const GetVacationSchema = z.object({
  userId: UserId,
});

export const UpdateVacationSchema = z.object({
  userId: UserId,
  enableAutoReply: z.boolean().describe("Whether to enable vacation auto-reply"),
  responseSubject: z.string().optional().describe("Subject of auto-reply (optional)"),
  responseBodyPlainText: z.string().optional().describe("Plain text body of auto-reply"),
  responseBodyHtml: z.string().optional().describe("HTML body of auto-reply"),
  restrictToContacts: z.boolean().optional().describe("Only reply to contacts"),
  restrictToDomain: z.boolean().optional().describe("Only reply to same domain"),
  startTime: z.string().optional().describe("Start time in milliseconds since epoch (string)"),
  endTime: z.string().optional().describe("End time in milliseconds since epoch (string)"),
});

// ── Watch / Stop ──

export const WatchSchema = z.object({
  userId: UserId,
  topicName: z.string().describe("Google Cloud Pub/Sub topic name (e.g. 'projects/myproject/topics/gmail')"),
  labelIds: z.array(z.string()).optional().describe("Label IDs to watch"),
  labelFilterAction: z.enum(["include", "exclude"]).optional().describe("Action for labelIds filter"),
});

export const StopWatchSchema = z.object({
  userId: UserId,
});

// ── Raw API Call ──

export const RawApiCallSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
  path: z.string().describe("API path starting with /users/{userId}/ (e.g. '/users/me/settings/filters')"),
  body: z.record(z.unknown()).optional().describe("JSON request body"),
  query: z.record(z.string()).optional().describe("Query string parameters"),
});
