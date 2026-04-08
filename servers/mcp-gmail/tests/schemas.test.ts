import { describe, it, expect } from "vitest";
import { ListMessagesSchema, SendMessageSchema, GetMessageSchema, ModifyMessageSchema, BatchModifyMessagesSchema, CreateDraftSchema, SendDraftSchema, CreateLabelSchema, ListThreadsSchema, ModifyThreadSchema, ListHistorySchema, UpdateVacationSchema, WatchSchema, RawApiCallSchema } from "../src/lib/schemas.js";
describe("Messages", () => {
  it("list", () => { expect(ListMessagesSchema.safeParse({ q: "from:jay@shinkofa.com" }).success).toBe(true); });
  it("send", () => { expect(SendMessageSchema.safeParse({ to: "test@example.com", subject: "Hi", body: "Hello" }).success).toBe(true); });
  it("get", () => { expect(GetMessageSchema.safeParse({ id: "msg123", format: "full" }).success).toBe(true); });
  it("modify", () => { expect(ModifyMessageSchema.safeParse({ id: "msg123", addLabelIds: ["STARRED"] }).success).toBe(true); });
  it("batch modify", () => { expect(BatchModifyMessagesSchema.safeParse({ ids: ["a", "b"], addLabelIds: ["UNREAD"] }).success).toBe(true); });
});
describe("Drafts", () => {
  it("create", () => { expect(CreateDraftSchema.safeParse({ to: "test@example.com", subject: "Draft", body: "Content" }).success).toBe(true); });
  it("send", () => { expect(SendDraftSchema.safeParse({ id: "d123" }).success).toBe(true); });
});
describe("Labels", () => { it("create", () => { expect(CreateLabelSchema.safeParse({ name: "Projects", color: { textColor: "#fff", backgroundColor: "#000" } }).success).toBe(true); }); });
describe("Threads", () => {
  it("list", () => { expect(ListThreadsSchema.safeParse({ q: "is:important" }).success).toBe(true); });
  it("modify", () => { expect(ModifyThreadSchema.safeParse({ id: "t123", addLabelIds: ["IMPORTANT"] }).success).toBe(true); });
});
describe("Misc", () => {
  it("history", () => { expect(ListHistorySchema.safeParse({ startHistoryId: "12345" }).success).toBe(true); });
  it("vacation", () => { expect(UpdateVacationSchema.safeParse({ enableAutoReply: true, responseSubject: "OOO" }).success).toBe(true); });
  it("watch", () => { expect(WatchSchema.safeParse({ topicName: "projects/myproject/topics/gmail" }).success).toBe(true); });
  it("raw", () => { expect(RawApiCallSchema.safeParse({ method: "GET", path: "/users/me/settings/filters" }).success).toBe(true); });
});
