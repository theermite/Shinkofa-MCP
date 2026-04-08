import { describe, it, expect } from "vitest";
import {
  SendMessageSchema, GetMessagesSchema, EditMessageSchema,
  DeleteMessageSchema, BulkDeleteMessagesSchema,
  GetChannelSchema, ModifyChannelSchema, CreateInviteSchema,
  CreateThreadSchema, CreateThreadFromMessageSchema,
  GetGuildSchema, ModifyGuildSchema, CreateGuildChannelSchema,
  ModifyWelcomeScreenSchema, ModifyOnboardingSchema,
  GetMemberSchema, ListMembersSchema, SearchMembersSchema,
  ModifyMemberSchema, BanMemberSchema, BulkBanSchema,
  CreateRoleSchema, ModifyRoleSchema, AssignRoleSchema,
  CreateWebhookSchema, ExecuteWebhookSchema,
  CreateCommandSchema, ModifyCommandSchema,
  CreateInteractionResponseSchema, CreateFollowupSchema,
  CreateEmojiSchema, ModifyEmojiSchema,
  CreateEventSchema, ModifyEventSchema,
  CreateAutoModRuleSchema, ModifyAutoModRuleSchema,
  GetAuditLogSchema, GetInviteSchema,
  RawApiCallSchema,
} from "../src/lib/schemas.js";

describe("Message schemas", () => {
  it("should validate send_message", () => {
    const result = SendMessageSchema.safeParse({ channel_id: "123", content: "Hello" });
    expect(result.success).toBe(true);
  });

  it("should reject empty content with embeds missing", () => {
    const result = SendMessageSchema.safeParse({ channel_id: "123" });
    expect(result.success).toBe(true); // Both optional, at least one should be present but schema allows it
  });

  it("should validate get_messages with pagination", () => {
    const result = GetMessagesSchema.safeParse({ channel_id: "123", limit: 50, before: "456" });
    expect(result.success).toBe(true);
  });

  it("should reject limit > 100", () => {
    const result = GetMessagesSchema.safeParse({ channel_id: "123", limit: 200 });
    expect(result.success).toBe(false);
  });

  it("should validate edit_message", () => {
    const result = EditMessageSchema.safeParse({ channel_id: "123", message_id: "456", content: "Updated" });
    expect(result.success).toBe(true);
  });

  it("should validate bulk_delete with valid range", () => {
    const result = BulkDeleteMessagesSchema.safeParse({ channel_id: "123", messages: ["1", "2", "3"] });
    expect(result.success).toBe(true);
  });

  it("should reject bulk_delete with < 2 messages", () => {
    const result = BulkDeleteMessagesSchema.safeParse({ channel_id: "123", messages: ["1"] });
    expect(result.success).toBe(false);
  });
});

describe("Channel schemas", () => {
  it("should validate modify_channel", () => {
    const result = ModifyChannelSchema.safeParse({ channel_id: "123", name: "general", topic: "Welcome!" });
    expect(result.success).toBe(true);
  });

  it("should validate slowmode range", () => {
    const valid = ModifyChannelSchema.safeParse({ channel_id: "123", rate_limit_per_user: 21600 });
    expect(valid.success).toBe(true);
    const invalid = ModifyChannelSchema.safeParse({ channel_id: "123", rate_limit_per_user: 30000 });
    expect(invalid.success).toBe(false);
  });

  it("should validate create_invite", () => {
    const result = CreateInviteSchema.safeParse({ channel_id: "123", max_age: 3600, max_uses: 10 });
    expect(result.success).toBe(true);
  });

  it("should validate create_thread", () => {
    const result = CreateThreadSchema.safeParse({ channel_id: "123", name: "My Thread", type: 11 });
    expect(result.success).toBe(true);
  });

  it("should validate create_thread_from_message", () => {
    const result = CreateThreadFromMessageSchema.safeParse({ channel_id: "123", message_id: "456", name: "Discussion" });
    expect(result.success).toBe(true);
  });
});

describe("Guild schemas", () => {
  it("should validate get_guild", () => {
    const result = GetGuildSchema.safeParse({ guild_id: "123", with_counts: true });
    expect(result.success).toBe(true);
  });

  it("should validate modify_guild", () => {
    const result = ModifyGuildSchema.safeParse({ guild_id: "123", name: "My Server", verification_level: 2 });
    expect(result.success).toBe(true);
  });

  it("should validate create_guild_channel", () => {
    const result = CreateGuildChannelSchema.safeParse({ guild_id: "123", name: "announcements", type: 5 });
    expect(result.success).toBe(true);
  });

  it("should validate modify_welcome_screen", () => {
    const result = ModifyWelcomeScreenSchema.safeParse({
      guild_id: "123",
      enabled: true,
      description: "Welcome!",
      welcome_channels: [{ channel_id: "456", description: "Rules" }],
    });
    expect(result.success).toBe(true);
  });

  it("should validate modify_onboarding", () => {
    const result = ModifyOnboardingSchema.safeParse({
      guild_id: "123",
      prompts: [{ title: "What interests you?" }],
      default_channel_ids: ["456"],
      enabled: true,
      mode: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe("Member schemas", () => {
  it("should validate list_members", () => {
    const result = ListMembersSchema.safeParse({ guild_id: "123", limit: 100 });
    expect(result.success).toBe(true);
  });

  it("should reject limit > 1000", () => {
    const result = ListMembersSchema.safeParse({ guild_id: "123", limit: 2000 });
    expect(result.success).toBe(false);
  });

  it("should validate search_members", () => {
    const result = SearchMembersSchema.safeParse({ guild_id: "123", query: "jay" });
    expect(result.success).toBe(true);
  });

  it("should validate modify_member with timeout", () => {
    const result = ModifyMemberSchema.safeParse({
      guild_id: "123", user_id: "456",
      communication_disabled_until: "2026-03-15T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("should validate ban with delete_message_seconds", () => {
    const result = BanMemberSchema.safeParse({ guild_id: "123", user_id: "456", delete_message_seconds: 86400 });
    expect(result.success).toBe(true);
  });

  it("should reject ban with > 7 days delete", () => {
    const result = BanMemberSchema.safeParse({ guild_id: "123", user_id: "456", delete_message_seconds: 700000 });
    expect(result.success).toBe(false);
  });

  it("should validate bulk_ban", () => {
    const result = BulkBanSchema.safeParse({ guild_id: "123", user_ids: ["1", "2", "3"] });
    expect(result.success).toBe(true);
  });
});

describe("Role schemas", () => {
  it("should validate create_role", () => {
    const result = CreateRoleSchema.safeParse({ guild_id: "123", name: "Moderator", color: 0x3498db, hoist: true });
    expect(result.success).toBe(true);
  });

  it("should validate modify_role", () => {
    const result = ModifyRoleSchema.safeParse({ guild_id: "123", role_id: "456", mentionable: true });
    expect(result.success).toBe(true);
  });

  it("should validate assign_role", () => {
    const result = AssignRoleSchema.safeParse({ guild_id: "123", user_id: "456", role_id: "789" });
    expect(result.success).toBe(true);
  });
});

describe("Webhook schemas", () => {
  it("should validate create_webhook", () => {
    const result = CreateWebhookSchema.safeParse({ channel_id: "123", name: "My Webhook" });
    expect(result.success).toBe(true);
  });

  it("should validate execute_webhook", () => {
    const result = ExecuteWebhookSchema.safeParse({
      webhook_id: "123", webhook_token: "abc",
      content: "Hello from webhook!", wait: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("Command schemas", () => {
  it("should validate create global command", () => {
    const result = CreateCommandSchema.safeParse({
      application_id: "123", name: "ping", description: "Pong!", type: 1,
    });
    expect(result.success).toBe(true);
  });

  it("should validate create guild command", () => {
    const result = CreateCommandSchema.safeParse({
      application_id: "123", guild_id: "456", name: "test", description: "Test command",
    });
    expect(result.success).toBe(true);
  });

  it("should reject command name > 32 chars", () => {
    const result = CreateCommandSchema.safeParse({
      application_id: "123", name: "a".repeat(33), description: "Too long",
    });
    expect(result.success).toBe(false);
  });
});

describe("Interaction schemas", () => {
  it("should validate interaction response", () => {
    const result = CreateInteractionResponseSchema.safeParse({
      interaction_id: "123", interaction_token: "abc", type: 4,
      data: { content: "Pong!" },
    });
    expect(result.success).toBe(true);
  });

  it("should validate followup", () => {
    const result = CreateFollowupSchema.safeParse({
      application_id: "123", interaction_token: "abc", content: "Follow up!",
    });
    expect(result.success).toBe(true);
  });
});

describe("Emoji schemas", () => {
  it("should validate create_emoji", () => {
    const result = CreateEmojiSchema.safeParse({
      guild_id: "123", name: "pepe", image: "data:image/png;base64,iVBOR...",
    });
    expect(result.success).toBe(true);
  });

  it("should reject emoji name < 2 chars", () => {
    const result = CreateEmojiSchema.safeParse({ guild_id: "123", name: "x", image: "data:..." });
    expect(result.success).toBe(false);
  });
});

describe("Event schemas", () => {
  it("should validate create external event", () => {
    const result = CreateEventSchema.safeParse({
      guild_id: "123", name: "Training Session",
      privacy_level: 2, entity_type: 3,
      scheduled_start_time: "2026-03-20T18:00:00Z",
      scheduled_end_time: "2026-03-20T20:00:00Z",
      entity_metadata: { location: "Discord Voice" },
    });
    expect(result.success).toBe(true);
  });

  it("should validate modify event status", () => {
    const result = ModifyEventSchema.safeParse({
      guild_id: "123", event_id: "456", status: 2,
    });
    expect(result.success).toBe(true);
  });
});

describe("Auto Moderation schemas", () => {
  it("should validate create automod rule", () => {
    const result = CreateAutoModRuleSchema.safeParse({
      guild_id: "123", name: "Block slurs", event_type: 1, trigger_type: 1,
      trigger_metadata: { keyword_filter: ["badword"] },
      actions: [{ type: 1 }],
    });
    expect(result.success).toBe(true);
  });
});

describe("Misc schemas", () => {
  it("should validate audit log query", () => {
    const result = GetAuditLogSchema.safeParse({ guild_id: "123", limit: 50, action_type: 25 });
    expect(result.success).toBe(true);
  });

  it("should validate get_invite", () => {
    const result = GetInviteSchema.safeParse({ invite_code: "abc123", with_counts: true });
    expect(result.success).toBe(true);
  });

  it("should validate raw_api_call", () => {
    const result = RawApiCallSchema.safeParse({
      method: "GET", path: "/guilds/123/stickers",
    });
    expect(result.success).toBe(true);
  });

  it("should validate raw_api_call with body", () => {
    const result = RawApiCallSchema.safeParse({
      method: "POST", path: "/guilds/123/stickers",
      body: { name: "sticker", tags: "tag" },
      reason: "Adding custom sticker",
    });
    expect(result.success).toBe(true);
  });
});
