import { describe, it, expect } from "vitest";
import {
  DoActionSchema,
  SendMessageSchema,
  GetGlobalsSchema,
  GetGlobalSchema,
  ExecuteCodeTriggerSchema,
  SubscribeSchema,
} from "../src/lib/schemas.js";

describe("DoActionSchema", () => {
  it("should_accept_action_by_name", () => {
    const result = DoActionSchema.safeParse({ name: "My Action" });
    expect(result.success).toBe(true);
  });

  it("should_accept_action_by_id", () => {
    const result = DoActionSchema.safeParse({ id: "abc-123" });
    expect(result.success).toBe(true);
  });

  it("should_accept_action_with_args", () => {
    const result = DoActionSchema.safeParse({ name: "Test", args: { key: "value" } });
    expect(result.success).toBe(true);
  });

  it("should_accept_empty_object", () => {
    const result = DoActionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should_reject_non_string_args_values", () => {
    const result = DoActionSchema.safeParse({ name: "Test", args: { key: 123 } });
    expect(result.success).toBe(false);
  });
});

describe("SendMessageSchema", () => {
  it("should_require_message", () => {
    const result = SendMessageSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should_accept_message_only_with_defaults", () => {
    const result = SendMessageSchema.safeParse({ message: "Hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platform).toBe("twitch");
      expect(result.data.bot).toBe(false);
    }
  });

  it("should_accept_youtube_platform", () => {
    const result = SendMessageSchema.safeParse({ message: "Hi", platform: "youtube" });
    expect(result.success).toBe(true);
  });

  it("should_reject_invalid_platform", () => {
    const result = SendMessageSchema.safeParse({ message: "Hi", platform: "discord" });
    expect(result.success).toBe(false);
  });
});

describe("GetGlobalsSchema", () => {
  it("should_default_persisted_to_true", () => {
    const result = GetGlobalsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.persisted).toBe(true);
  });

  it("should_accept_persisted_false", () => {
    const result = GetGlobalsSchema.safeParse({ persisted: false });
    expect(result.success).toBe(true);
  });
});

describe("GetGlobalSchema", () => {
  it("should_require_variable_name", () => {
    const result = GetGlobalSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should_accept_variable_with_default_persisted", () => {
    const result = GetGlobalSchema.safeParse({ variable: "myVar" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.persisted).toBe(true);
  });
});

describe("ExecuteCodeTriggerSchema", () => {
  it("should_require_triggerName", () => {
    const result = ExecuteCodeTriggerSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should_accept_trigger_with_args", () => {
    const result = ExecuteCodeTriggerSchema.safeParse({
      triggerName: "myTrigger",
      args: { param: "value" },
    });
    expect(result.success).toBe(true);
  });

  it("should_accept_trigger_without_args", () => {
    const result = ExecuteCodeTriggerSchema.safeParse({ triggerName: "myTrigger" });
    expect(result.success).toBe(true);
  });
});

describe("SubscribeSchema", () => {
  it("should_require_events_map", () => {
    const result = SubscribeSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should_accept_valid_event_map", () => {
    const result = SubscribeSchema.safeParse({
      events: { Twitch: ["ChatMessage", "Follow"], YouTube: ["SuperChat"] },
    });
    expect(result.success).toBe(true);
  });

  it("should_reject_non_array_event_values", () => {
    const result = SubscribeSchema.safeParse({
      events: { Twitch: "ChatMessage" },
    });
    expect(result.success).toBe(false);
  });
});
