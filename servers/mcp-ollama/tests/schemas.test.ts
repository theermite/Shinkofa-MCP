import { describe, expect, it } from "vitest";
import {
  ChatSchema,
  CheckBlobSchema,
  CopyModelSchema,
  CreateModelSchema,
  DeleteModelSchema,
  EmbedSchema,
  GenerateSchema,
  PullModelSchema,
  RawApiCallSchema,
  ShowModelSchema,
} from "../src/lib/schemas.js";

describe("GenerateSchema", () => {
  it("should_accept_valid_generate_input", () => {
    const result = GenerateSchema.safeParse({
      model: "llama3",
      prompt: "Hello",
    });
    expect(result.success).toBe(true);
  });

  it("should_reject_empty_model", () => {
    const result = GenerateSchema.safeParse({ model: "", prompt: "Hello" });
    expect(result.success).toBe(false);
  });

  it("should_accept_full_options", () => {
    const result = GenerateSchema.safeParse({
      model: "qwen3:8b",
      prompt: "test",
      options: { temperature: 0.7, top_p: 0.9, num_ctx: 4096 },
      format: "json",
      keep_alive: "10m",
      think: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("ChatSchema", () => {
  it("should_accept_valid_chat_input", () => {
    const result = ChatSchema.safeParse({
      model: "llama3",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.success).toBe(true);
  });

  it("should_reject_empty_messages", () => {
    const result = ChatSchema.safeParse({
      model: "llama3",
      messages: [],
    });
    expect(result.success).toBe(false);
  });

  it("should_reject_invalid_role", () => {
    const result = ChatSchema.safeParse({
      model: "llama3",
      messages: [{ role: "invalid", content: "hi" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("EmbedSchema", () => {
  it("should_accept_string_input", () => {
    const result = EmbedSchema.safeParse({ model: "nomic-embed-text", input: "hello" });
    expect(result.success).toBe(true);
  });

  it("should_accept_array_input", () => {
    const result = EmbedSchema.safeParse({
      model: "nomic-embed-text",
      input: ["hello", "world"],
    });
    expect(result.success).toBe(true);
  });
});

describe("Model schemas", () => {
  it("should_validate_ShowModelSchema", () => {
    expect(ShowModelSchema.safeParse({ model: "llama3" }).success).toBe(true);
  });

  it("should_validate_CopyModelSchema", () => {
    expect(CopyModelSchema.safeParse({ source: "a", destination: "b" }).success).toBe(true);
  });

  it("should_validate_DeleteModelSchema", () => {
    expect(DeleteModelSchema.safeParse({ model: "old" }).success).toBe(true);
  });

  it("should_validate_PullModelSchema", () => {
    expect(PullModelSchema.safeParse({ model: "llama3" }).success).toBe(true);
  });

  it("should_validate_CreateModelSchema", () => {
    expect(
      CreateModelSchema.safeParse({
        model: "custom",
        modelfile: "FROM llama3\nSYSTEM You are helpful.",
      }).success,
    ).toBe(true);
  });

  it("should_validate_CheckBlobSchema", () => {
    expect(CheckBlobSchema.safeParse({ digest: "sha256:abc123" }).success).toBe(true);
  });
});

describe("RawApiCallSchema", () => {
  it("should_accept_get_request", () => {
    const result = RawApiCallSchema.safeParse({
      method: "GET",
      path: "/api/tags",
    });
    expect(result.success).toBe(true);
  });

  it("should_accept_post_with_body", () => {
    const result = RawApiCallSchema.safeParse({
      method: "POST",
      path: "/api/generate",
      body: { model: "llama3", prompt: "hi" },
    });
    expect(result.success).toBe(true);
  });

  it("should_reject_invalid_method", () => {
    const result = RawApiCallSchema.safeParse({
      method: "PATCH",
      path: "/api/tags",
    });
    expect(result.success).toBe(false);
  });
});
