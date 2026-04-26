import { describe, expect, it } from "vitest";
import { DeleteMessagesSchema, SendMediaSchema, SendMessageSchema, SendPollSchema } from "../src/lib/schemas.js";
import {
  BanChatMemberSchema,
  CreateForumTopicSchema,
  RawApiCallSchema,
  SendInvoiceSchema,
  SetWebhookSchema,
} from "../src/lib/schemas-bot.js";

describe("SendMessageSchema", () => {
  it("should accept valid message", () => {
    const result = SendMessageSchema.safeParse({
      chat_id: 123,
      text: "Hello world",
    });
    expect(result.success).toBe(true);
  });

  it("should accept string chat_id (username)", () => {
    const result = SendMessageSchema.safeParse({
      chat_id: "@mychannel",
      text: "Hello",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty text", () => {
    const result = SendMessageSchema.safeParse({
      chat_id: 123,
      text: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject text over 4096 chars", () => {
    const result = SendMessageSchema.safeParse({
      chat_id: 123,
      text: "x".repeat(4097),
    });
    expect(result.success).toBe(false);
  });

  it("should accept all optional fields", () => {
    const result = SendMessageSchema.safeParse({
      chat_id: 123,
      text: "Hello",
      parse_mode: "HTML",
      disable_notification: true,
      protect_content: true,
      message_thread_id: 42,
      reply_parameters: { message_id: 10 },
      reply_markup: { inline_keyboard: [] },
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid parse_mode", () => {
    const result = SendMessageSchema.safeParse({
      chat_id: 123,
      text: "Hello",
      parse_mode: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});

describe("SendMediaSchema", () => {
  it("should accept valid photo", () => {
    const result = SendMediaSchema.safeParse({
      chat_id: 123,
      type: "photo",
      media: "https://example.com/photo.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("should accept video with all fields", () => {
    const result = SendMediaSchema.safeParse({
      chat_id: 123,
      type: "video",
      media: "file_id_123",
      caption: "My video",
      duration: 120,
      width: 1920,
      height: 1080,
      supports_streaming: true,
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid media type", () => {
    const result = SendMediaSchema.safeParse({
      chat_id: 123,
      type: "invalid_type",
      media: "file_id",
    });
    expect(result.success).toBe(false);
  });
});

describe("DeleteMessagesSchema", () => {
  it("should accept valid array", () => {
    const result = DeleteMessagesSchema.safeParse({
      chat_id: 123,
      message_ids: [1, 2, 3],
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty array", () => {
    const result = DeleteMessagesSchema.safeParse({
      chat_id: 123,
      message_ids: [],
    });
    expect(result.success).toBe(false);
  });

  it("should reject more than 100 IDs", () => {
    const result = DeleteMessagesSchema.safeParse({
      chat_id: 123,
      message_ids: Array.from({ length: 101 }, (_, i) => i),
    });
    expect(result.success).toBe(false);
  });
});

describe("SendPollSchema", () => {
  it("should accept valid poll", () => {
    const result = SendPollSchema.safeParse({
      chat_id: 123,
      question: "What is your favorite color?",
      options: [{ text: "Red" }, { text: "Blue" }],
    });
    expect(result.success).toBe(true);
  });

  it("should reject poll with only 1 option", () => {
    const result = SendPollSchema.safeParse({
      chat_id: 123,
      question: "Q?",
      options: [{ text: "Only one" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("BanChatMemberSchema", () => {
  it("should accept valid ban", () => {
    const result = BanChatMemberSchema.safeParse({
      chat_id: -100123456,
      user_id: 789,
    });
    expect(result.success).toBe(true);
  });

  it("should accept ban with until_date", () => {
    const result = BanChatMemberSchema.safeParse({
      chat_id: -100123456,
      user_id: 789,
      until_date: Math.floor(Date.now() / 1000) + 86400,
      revoke_messages: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("SetWebhookSchema", () => {
  it("should accept valid webhook URL", () => {
    const result = SetWebhookSchema.safeParse({
      url: "https://example.com/webhook",
    });
    expect(result.success).toBe(true);
  });

  it("should reject non-URL", () => {
    const result = SetWebhookSchema.safeParse({
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("should accept all webhook options", () => {
    const result = SetWebhookSchema.safeParse({
      url: "https://example.com/webhook",
      max_connections: 40,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
      secret_token: "my-secret",
    });
    expect(result.success).toBe(true);
  });
});

describe("RawApiCallSchema", () => {
  it("should accept method only", () => {
    const result = RawApiCallSchema.safeParse({
      method: "getMe",
    });
    expect(result.success).toBe(true);
  });

  it("should accept method with params", () => {
    const result = RawApiCallSchema.safeParse({
      method: "sendChecklist",
      params: { chat_id: 123, checklist: [] },
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty method", () => {
    const result = RawApiCallSchema.safeParse({
      method: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("CreateForumTopicSchema", () => {
  it("should accept valid topic", () => {
    const result = CreateForumTopicSchema.safeParse({
      chat_id: -100123456,
      name: "General Discussion",
    });
    expect(result.success).toBe(true);
  });
});

describe("SendInvoiceSchema", () => {
  it("should accept valid invoice", () => {
    const result = SendInvoiceSchema.safeParse({
      chat_id: 123,
      title: "Premium",
      description: "Monthly subscription",
      payload: "sub_monthly",
      currency: "EUR",
      prices: [{ label: "Monthly", amount: 999 }],
    });
    expect(result.success).toBe(true);
  });
});
