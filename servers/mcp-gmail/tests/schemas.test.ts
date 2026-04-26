import { describe, expect, it } from "vitest";
import {
  BatchDeleteMessagesSchema,
  BatchModifyMessagesSchema,
  CreateDraftSchema,
  CreateLabelSchema,
  DeleteDraftSchema,
  DeleteLabelSchema,
  DeleteMessageSchema,
  DeleteThreadSchema,
  GetAttachmentSchema,
  GetDraftSchema,
  GetLabelSchema,
  GetMessageSchema,
  GetProfileSchema,
  GetThreadSchema,
  GetVacationSchema,
  ListDraftsSchema,
  ListHistorySchema,
  ListLabelsSchema,
  ListMessagesSchema,
  ListThreadsSchema,
  ModifyMessageSchema,
  ModifyThreadSchema,
  RawApiCallSchema,
  SendDraftSchema,
  SendMessageSchema,
  StopWatchSchema,
  TrashMessageSchema,
  TrashThreadSchema,
  UntrashMessageSchema,
  UntrashThreadSchema,
  UpdateDraftSchema,
  UpdateLabelSchema,
  UpdateVacationSchema,
  WatchSchema,
} from "../src/lib/schemas.js";

// ── Messages — happy path ─────────────────────────────────────────────────────

describe("ListMessagesSchema", () => {
  it("should accept minimal input (userId defaults to me)", () => {
    expect(ListMessagesSchema.safeParse({}).success).toBe(true);
  });

  it("should accept full valid input", () => {
    expect(
      ListMessagesSchema.safeParse({
        q: "from:jay@shinkofa.com",
        maxResults: 50,
        pageToken: "abc123",
        labelIds: ["INBOX", "UNREAD"],
        includeSpamTrash: false,
      }).success,
    ).toBe(true);
  });

  it("should reject maxResults below 1", () => {
    expect(ListMessagesSchema.safeParse({ maxResults: 0 }).success).toBe(false);
  });

  it("should reject maxResults above 500", () => {
    expect(ListMessagesSchema.safeParse({ maxResults: 501 }).success).toBe(false);
  });

  it("should reject non-array labelIds", () => {
    expect(ListMessagesSchema.safeParse({ labelIds: "INBOX" }).success).toBe(false);
  });
});

describe("GetMessageSchema", () => {
  it("should accept minimal input with id", () => {
    expect(GetMessageSchema.safeParse({ id: "msg123", format: "full" }).success).toBe(true);
  });

  it("should require id", () => {
    expect(GetMessageSchema.safeParse({}).success).toBe(false);
  });

  it("should reject invalid format enum", () => {
    expect(GetMessageSchema.safeParse({ id: "msg123", format: "invalid" }).success).toBe(false);
  });

  it("should accept all valid format values", () => {
    for (const format of ["minimal", "full", "raw", "metadata"]) {
      expect(GetMessageSchema.safeParse({ id: "msg123", format }).success).toBe(true);
    }
  });

  it("should accept metadataHeaders as array of strings", () => {
    expect(GetMessageSchema.safeParse({ id: "msg123", metadataHeaders: ["From", "Subject"] }).success).toBe(true);
  });
});

describe("SendMessageSchema", () => {
  it("should accept minimal required fields", () => {
    expect(SendMessageSchema.safeParse({ to: "test@example.com", subject: "Hi", body: "Hello" }).success).toBe(true);
  });

  it("should require to field", () => {
    expect(SendMessageSchema.safeParse({ subject: "Hi", body: "Hello" }).success).toBe(false);
  });

  it("should require subject field", () => {
    expect(SendMessageSchema.safeParse({ to: "test@example.com", body: "Hello" }).success).toBe(false);
  });

  it("should require body field", () => {
    expect(SendMessageSchema.safeParse({ to: "test@example.com", subject: "Hi" }).success).toBe(false);
  });

  it("should accept optional fields", () => {
    expect(
      SendMessageSchema.safeParse({
        to: "a@b.com",
        subject: "S",
        body: "B",
        cc: "c@b.com",
        bcc: "d@b.com",
        replyTo: "r@b.com",
        inReplyTo: "<msg@b.com>",
        references: "<ref@b.com>",
        isHtml: true,
        threadId: "thread123",
      }).success,
    ).toBe(true);
  });

  it("should default isHtml to false", () => {
    const result = SendMessageSchema.parse({ to: "a@b.com", subject: "S", body: "B" });
    expect(result.isHtml).toBe(false);
  });
});

describe("DeleteMessageSchema", () => {
  it("should accept valid input", () => {
    expect(DeleteMessageSchema.safeParse({ id: "msg123" }).success).toBe(true);
  });

  it("should require id", () => {
    expect(DeleteMessageSchema.safeParse({}).success).toBe(false);
  });
});

describe("TrashMessageSchema", () => {
  it("should accept valid input", () => {
    expect(TrashMessageSchema.safeParse({ id: "msg123" }).success).toBe(true);
  });

  it("should require id", () => {
    expect(TrashMessageSchema.safeParse({}).success).toBe(false);
  });
});

describe("UntrashMessageSchema", () => {
  it("should accept valid input", () => {
    expect(UntrashMessageSchema.safeParse({ id: "msg123" }).success).toBe(true);
  });

  it("should require id", () => {
    expect(UntrashMessageSchema.safeParse({}).success).toBe(false);
  });
});

describe("ModifyMessageSchema", () => {
  it("should accept with addLabelIds only", () => {
    expect(ModifyMessageSchema.safeParse({ id: "msg123", addLabelIds: ["STARRED"] }).success).toBe(true);
  });

  it("should accept with removeLabelIds only", () => {
    expect(ModifyMessageSchema.safeParse({ id: "msg123", removeLabelIds: ["UNREAD"] }).success).toBe(true);
  });

  it("should accept with both add and remove", () => {
    expect(
      ModifyMessageSchema.safeParse({
        id: "msg123",
        addLabelIds: ["STARRED"],
        removeLabelIds: ["UNREAD"],
      }).success,
    ).toBe(true);
  });

  it("should require id", () => {
    expect(ModifyMessageSchema.safeParse({ addLabelIds: ["STARRED"] }).success).toBe(false);
  });
});

describe("BatchModifyMessagesSchema", () => {
  it("should accept valid input with min 1 id", () => {
    expect(BatchModifyMessagesSchema.safeParse({ ids: ["a", "b"], addLabelIds: ["UNREAD"] }).success).toBe(true);
  });

  it("should reject empty ids array", () => {
    expect(BatchModifyMessagesSchema.safeParse({ ids: [] }).success).toBe(false);
  });

  it("should reject ids array with more than 1000 items", () => {
    const ids = Array.from({ length: 1001 }, (_, i) => `msg${i}`);
    expect(BatchModifyMessagesSchema.safeParse({ ids }).success).toBe(false);
  });

  it("should require ids field", () => {
    expect(BatchModifyMessagesSchema.safeParse({ addLabelIds: ["UNREAD"] }).success).toBe(false);
  });
});

describe("BatchDeleteMessagesSchema", () => {
  it("should accept valid batch of ids", () => {
    expect(BatchDeleteMessagesSchema.safeParse({ ids: ["msg1", "msg2"] }).success).toBe(true);
  });

  it("should reject empty ids array", () => {
    expect(BatchDeleteMessagesSchema.safeParse({ ids: [] }).success).toBe(false);
  });

  it("should reject ids array above 1000", () => {
    const ids = Array.from({ length: 1001 }, (_, i) => `msg${i}`);
    expect(BatchDeleteMessagesSchema.safeParse({ ids }).success).toBe(false);
  });

  it("should require ids field", () => {
    expect(BatchDeleteMessagesSchema.safeParse({}).success).toBe(false);
  });
});

describe("GetAttachmentSchema", () => {
  it("should accept valid input", () => {
    expect(
      GetAttachmentSchema.safeParse({
        messageId: "msg123",
        attachmentId: "att456",
      }).success,
    ).toBe(true);
  });

  it("should require messageId", () => {
    expect(GetAttachmentSchema.safeParse({ attachmentId: "att456" }).success).toBe(false);
  });

  it("should require attachmentId", () => {
    expect(GetAttachmentSchema.safeParse({ messageId: "msg123" }).success).toBe(false);
  });

  it("should default userId to me", () => {
    const result = GetAttachmentSchema.parse({ messageId: "msg123", attachmentId: "att456" });
    expect(result.userId).toBe("me");
  });
});

// ── Drafts ────────────────────────────────────────────────────────────────────

describe("ListDraftsSchema", () => {
  it("should accept empty input (all optional)", () => {
    expect(ListDraftsSchema.safeParse({}).success).toBe(true);
  });

  it("should accept full valid input", () => {
    expect(ListDraftsSchema.safeParse({ maxResults: 20, q: "subject:test", includeSpamTrash: true }).success).toBe(
      true,
    );
  });

  it("should reject maxResults above 500", () => {
    expect(ListDraftsSchema.safeParse({ maxResults: 501 }).success).toBe(false);
  });
});

describe("GetDraftSchema", () => {
  it("should accept valid input", () => {
    expect(GetDraftSchema.safeParse({ id: "d123" }).success).toBe(true);
  });

  it("should require id", () => {
    expect(GetDraftSchema.safeParse({}).success).toBe(false);
  });

  it("should reject invalid format enum", () => {
    expect(GetDraftSchema.safeParse({ id: "d123", format: "invalid" }).success).toBe(false);
  });
});

describe("CreateDraftSchema", () => {
  it("should accept minimal required fields", () => {
    expect(CreateDraftSchema.safeParse({ to: "a@b.com", subject: "S", body: "B" }).success).toBe(true);
  });

  it("should require to, subject, and body", () => {
    expect(CreateDraftSchema.safeParse({}).success).toBe(false);
  });

  it("should default isHtml to false", () => {
    const result = CreateDraftSchema.parse({ to: "a@b.com", subject: "S", body: "B" });
    expect(result.isHtml).toBe(false);
  });
});

describe("UpdateDraftSchema", () => {
  it("should accept valid input with required fields", () => {
    expect(
      UpdateDraftSchema.safeParse({
        id: "d123",
        to: "a@b.com",
        subject: "Updated Subject",
        body: "Updated body",
      }).success,
    ).toBe(true);
  });

  it("should require id", () => {
    expect(UpdateDraftSchema.safeParse({ to: "a@b.com", subject: "S", body: "B" }).success).toBe(false);
  });

  it("should require to", () => {
    expect(UpdateDraftSchema.safeParse({ id: "d123", subject: "S", body: "B" }).success).toBe(false);
  });

  it("should accept optional cc, bcc, replyTo", () => {
    expect(
      UpdateDraftSchema.safeParse({
        id: "d123",
        to: "a@b.com",
        subject: "S",
        body: "B",
        cc: "cc@b.com",
        bcc: "bcc@b.com",
        replyTo: "r@b.com",
      }).success,
    ).toBe(true);
  });

  it("should default isHtml to false", () => {
    const result = UpdateDraftSchema.parse({ id: "d123", to: "a@b.com", subject: "S", body: "B" });
    expect(result.isHtml).toBe(false);
  });
});

describe("DeleteDraftSchema", () => {
  it("should accept valid input", () => {
    expect(DeleteDraftSchema.safeParse({ id: "d123" }).success).toBe(true);
  });

  it("should require id", () => {
    expect(DeleteDraftSchema.safeParse({}).success).toBe(false);
  });
});

describe("SendDraftSchema", () => {
  it("should accept valid draft id", () => {
    expect(SendDraftSchema.safeParse({ id: "d123" }).success).toBe(true);
  });

  it("should require id", () => {
    expect(SendDraftSchema.safeParse({}).success).toBe(false);
  });
});

// ── Labels ────────────────────────────────────────────────────────────────────

describe("ListLabelsSchema", () => {
  it("should accept empty input (userId defaults)", () => {
    expect(ListLabelsSchema.safeParse({}).success).toBe(true);
  });
});

describe("GetLabelSchema", () => {
  it("should accept valid input", () => {
    expect(GetLabelSchema.safeParse({ id: "label123" }).success).toBe(true);
  });

  it("should require id", () => {
    expect(GetLabelSchema.safeParse({}).success).toBe(false);
  });
});

describe("CreateLabelSchema", () => {
  it("should accept minimal input with name only", () => {
    expect(CreateLabelSchema.safeParse({ name: "Projects" }).success).toBe(true);
  });

  it("should accept full label with color", () => {
    expect(
      CreateLabelSchema.safeParse({
        name: "Projects",
        color: { textColor: "#fff", backgroundColor: "#000" },
      }).success,
    ).toBe(true);
  });

  it("should require name", () => {
    expect(CreateLabelSchema.safeParse({}).success).toBe(false);
  });

  it("should reject invalid labelListVisibility enum", () => {
    expect(CreateLabelSchema.safeParse({ name: "Test", labelListVisibility: "invalid" }).success).toBe(false);
  });

  it("should accept all valid labelListVisibility values", () => {
    for (const v of ["labelShow", "labelShowIfUnread", "labelHide"]) {
      expect(CreateLabelSchema.safeParse({ name: "Test", labelListVisibility: v }).success).toBe(true);
    }
  });

  it("should reject invalid messageListVisibility enum", () => {
    expect(CreateLabelSchema.safeParse({ name: "Test", messageListVisibility: "visible" }).success).toBe(false);
  });

  it("should accept show and hide for messageListVisibility", () => {
    for (const v of ["show", "hide"]) {
      expect(CreateLabelSchema.safeParse({ name: "Test", messageListVisibility: v }).success).toBe(true);
    }
  });
});

describe("UpdateLabelSchema", () => {
  it("should accept valid input with id only (all others optional)", () => {
    expect(UpdateLabelSchema.safeParse({ id: "label123" }).success).toBe(true);
  });

  it("should require id", () => {
    expect(UpdateLabelSchema.safeParse({ name: "NewName" }).success).toBe(false);
  });

  it("should accept optional name update", () => {
    expect(UpdateLabelSchema.safeParse({ id: "label123", name: "Renamed" }).success).toBe(true);
  });

  it("should accept color update", () => {
    expect(
      UpdateLabelSchema.safeParse({
        id: "label123",
        color: { textColor: "#ffffff", backgroundColor: "#000000" },
      }).success,
    ).toBe(true);
  });
});

describe("DeleteLabelSchema", () => {
  it("should accept valid input", () => {
    expect(DeleteLabelSchema.safeParse({ id: "label123" }).success).toBe(true);
  });

  it("should require id", () => {
    expect(DeleteLabelSchema.safeParse({}).success).toBe(false);
  });
});

// ── Threads ───────────────────────────────────────────────────────────────────

describe("ListThreadsSchema", () => {
  it("should accept empty input", () => {
    expect(ListThreadsSchema.safeParse({ q: "is:important" }).success).toBe(true);
  });

  it("should accept full valid input", () => {
    expect(
      ListThreadsSchema.safeParse({
        maxResults: 25,
        q: "label:work",
        labelIds: ["IMPORTANT"],
        includeSpamTrash: false,
      }).success,
    ).toBe(true);
  });

  it("should reject maxResults above 500", () => {
    expect(ListThreadsSchema.safeParse({ maxResults: 501 }).success).toBe(false);
  });
});

describe("GetThreadSchema", () => {
  it("should accept valid input", () => {
    expect(GetThreadSchema.safeParse({ id: "thread123" }).success).toBe(true);
  });

  it("should require id", () => {
    expect(GetThreadSchema.safeParse({}).success).toBe(false);
  });

  it("should reject format raw (not valid for threads)", () => {
    expect(GetThreadSchema.safeParse({ id: "thread123", format: "raw" }).success).toBe(false);
  });

  it("should accept valid thread formats", () => {
    for (const format of ["minimal", "full", "metadata"]) {
      expect(GetThreadSchema.safeParse({ id: "thread123", format }).success).toBe(true);
    }
  });
});

describe("ModifyThreadSchema", () => {
  it("should accept valid input", () => {
    expect(ModifyThreadSchema.safeParse({ id: "t123", addLabelIds: ["IMPORTANT"] }).success).toBe(true);
  });

  it("should require id", () => {
    expect(ModifyThreadSchema.safeParse({ addLabelIds: ["IMPORTANT"] }).success).toBe(false);
  });
});

describe("TrashThreadSchema", () => {
  it("should accept valid input", () => {
    expect(TrashThreadSchema.safeParse({ id: "thread123" }).success).toBe(true);
  });

  it("should require id", () => {
    expect(TrashThreadSchema.safeParse({}).success).toBe(false);
  });
});

describe("UntrashThreadSchema", () => {
  it("should accept valid input", () => {
    expect(UntrashThreadSchema.safeParse({ id: "thread123" }).success).toBe(true);
  });

  it("should require id", () => {
    expect(UntrashThreadSchema.safeParse({}).success).toBe(false);
  });
});

describe("DeleteThreadSchema", () => {
  it("should accept valid input", () => {
    expect(DeleteThreadSchema.safeParse({ id: "thread123" }).success).toBe(true);
  });

  it("should require id", () => {
    expect(DeleteThreadSchema.safeParse({}).success).toBe(false);
  });
});

// ── Misc ──────────────────────────────────────────────────────────────────────

describe("ListHistorySchema", () => {
  it("should accept valid input with required startHistoryId", () => {
    expect(ListHistorySchema.safeParse({ startHistoryId: "12345" }).success).toBe(true);
  });

  it("should require startHistoryId", () => {
    expect(ListHistorySchema.safeParse({}).success).toBe(false);
  });

  it("should accept valid historyTypes enum values", () => {
    expect(
      ListHistorySchema.safeParse({
        startHistoryId: "12345",
        historyTypes: ["messageAdded", "labelAdded"],
      }).success,
    ).toBe(true);
  });

  it("should reject invalid historyTypes enum value", () => {
    expect(
      ListHistorySchema.safeParse({
        startHistoryId: "12345",
        historyTypes: ["messageAdded", "invalid"],
      }).success,
    ).toBe(false);
  });
});

describe("GetProfileSchema", () => {
  it("should accept empty input (userId defaults)", () => {
    expect(GetProfileSchema.safeParse({}).success).toBe(true);
  });

  it("should default userId to me", () => {
    const result = GetProfileSchema.parse({});
    expect(result.userId).toBe("me");
  });
});

describe("GetVacationSchema", () => {
  it("should accept empty input", () => {
    expect(GetVacationSchema.safeParse({}).success).toBe(true);
  });
});

describe("UpdateVacationSchema", () => {
  it("should accept minimal input with enableAutoReply", () => {
    expect(UpdateVacationSchema.safeParse({ enableAutoReply: true, responseSubject: "OOO" }).success).toBe(true);
  });

  it("should require enableAutoReply", () => {
    expect(UpdateVacationSchema.safeParse({ responseSubject: "Away" }).success).toBe(false);
  });

  it("should accept full valid input", () => {
    expect(
      UpdateVacationSchema.safeParse({
        enableAutoReply: true,
        responseSubject: "Out of Office",
        responseBodyPlainText: "I am away.",
        responseBodyHtml: "<p>I am away.</p>",
        restrictToContacts: true,
        restrictToDomain: false,
        startTime: "1717200000000",
        endTime: "1717286400000",
      }).success,
    ).toBe(true);
  });
});

describe("WatchSchema", () => {
  it("should accept valid input with topicName", () => {
    expect(WatchSchema.safeParse({ topicName: "projects/myproject/topics/gmail" }).success).toBe(true);
  });

  it("should require topicName", () => {
    expect(WatchSchema.safeParse({}).success).toBe(false);
  });

  it("should accept optional labelIds and labelFilterAction", () => {
    expect(
      WatchSchema.safeParse({
        topicName: "projects/myproject/topics/gmail",
        labelIds: ["INBOX"],
        labelFilterAction: "include",
      }).success,
    ).toBe(true);
  });

  it("should reject invalid labelFilterAction enum", () => {
    expect(
      WatchSchema.safeParse({
        topicName: "projects/myproject/topics/gmail",
        labelFilterAction: "filter",
      }).success,
    ).toBe(false);
  });
});

describe("StopWatchSchema", () => {
  it("should accept empty input (userId defaults)", () => {
    expect(StopWatchSchema.safeParse({}).success).toBe(true);
  });
});

describe("RawApiCallSchema", () => {
  it("should accept valid GET with path", () => {
    expect(RawApiCallSchema.safeParse({ method: "GET", path: "/users/me/settings/filters" }).success).toBe(true);
  });

  it("should require method", () => {
    expect(RawApiCallSchema.safeParse({ path: "/users/me/profile" }).success).toBe(false);
  });

  it("should require path", () => {
    expect(RawApiCallSchema.safeParse({ method: "GET" }).success).toBe(false);
  });

  it("should reject invalid HTTP method", () => {
    expect(RawApiCallSchema.safeParse({ method: "HEAD", path: "/users/me/profile" }).success).toBe(false);
  });

  it("should accept all valid HTTP methods", () => {
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
      expect(RawApiCallSchema.safeParse({ method, path: "/users/me/profile" }).success).toBe(true);
    }
  });

  it("should accept optional body and query", () => {
    expect(
      RawApiCallSchema.safeParse({
        method: "POST",
        path: "/users/me/labels",
        body: { name: "Test" },
        query: { param: "value" },
      }).success,
    ).toBe(true);
  });
});
