import { describe, it, expect } from "vitest";
import {
  GetNoteSchema, CreateNoteSchema, UpdateNoteSchema,
  AppendNoteSchema, PrependNoteSchema, DeleteNoteSchema,
  ListFilesSchema, SearchSchema, SearchJsonLogicSchema,
  GetActiveFileSchema, UpdateActiveFileSchema, AppendActiveFileSchema,
  ListCommandsSchema, ExecuteCommandSchema,
  OpenNoteSchema, GetPeriodicNoteSchema, GetStatusSchema,
  RawApiCallSchema,
} from "../src/lib/schemas.js";

describe("Vault schemas", () => {
  it("should_validate_GetNoteSchema", () => {
    expect(GetNoteSchema.parse({ path: "note.md" })).toEqual({ path: "note.md" });
  });

  it("should_reject_GetNoteSchema_without_path", () => {
    expect(() => GetNoteSchema.parse({})).toThrow();
  });

  it("should_validate_CreateNoteSchema", () => {
    expect(CreateNoteSchema.parse({ path: "new.md", content: "# Hello" })).toEqual({ path: "new.md", content: "# Hello" });
  });

  it("should_validate_ListFilesSchema_empty", () => {
    expect(ListFilesSchema.parse({})).toEqual({});
  });

  it("should_validate_ListFilesSchema_with_path", () => {
    expect(ListFilesSchema.parse({ path: "sub" })).toEqual({ path: "sub" });
  });

  it("should_validate_SearchSchema", () => {
    expect(SearchSchema.parse({ query: "test" })).toEqual({ query: "test" });
  });

  it("should_validate_SearchSchema_with_contextLength", () => {
    expect(SearchSchema.parse({ query: "test", contextLength: 100 })).toEqual({ query: "test", contextLength: 100 });
  });

  it("should_validate_SearchJsonLogicSchema", () => {
    const q = { "==": [{ var: "path" }, "test.md"] };
    expect(SearchJsonLogicSchema.parse({ query: q })).toEqual({ query: q });
  });
});

describe("Active file schemas", () => {
  it("should_validate_GetActiveFileSchema_empty", () => {
    expect(GetActiveFileSchema.parse({})).toEqual({});
  });

  it("should_validate_UpdateActiveFileSchema", () => {
    expect(UpdateActiveFileSchema.parse({ content: "text" })).toEqual({ content: "text" });
  });

  it("should_validate_AppendActiveFileSchema", () => {
    expect(AppendActiveFileSchema.parse({ content: "text" })).toEqual({ content: "text" });
  });
});

describe("Command schemas", () => {
  it("should_validate_ListCommandsSchema_empty", () => {
    expect(ListCommandsSchema.parse({})).toEqual({});
  });

  it("should_validate_ExecuteCommandSchema", () => {
    expect(ExecuteCommandSchema.parse({ commandId: "editor:toggle-bold" })).toEqual({ commandId: "editor:toggle-bold" });
  });
});

describe("Other schemas", () => {
  it("should_validate_OpenNoteSchema", () => {
    expect(OpenNoteSchema.parse({ path: "note.md" })).toEqual({ path: "note.md" });
  });

  it("should_validate_OpenNoteSchema_with_newLeaf", () => {
    expect(OpenNoteSchema.parse({ path: "note.md", newLeaf: true })).toEqual({ path: "note.md", newLeaf: true });
  });

  it("should_validate_GetPeriodicNoteSchema", () => {
    expect(GetPeriodicNoteSchema.parse({ period: "daily" })).toEqual({ period: "daily" });
  });

  it("should_reject_invalid_period", () => {
    expect(() => GetPeriodicNoteSchema.parse({ period: "hourly" })).toThrow();
  });

  it("should_validate_GetStatusSchema_empty", () => {
    expect(GetStatusSchema.parse({})).toEqual({});
  });

  it("should_validate_RawApiCallSchema", () => {
    expect(RawApiCallSchema.parse({ method: "GET", path: "/vault/" })).toEqual({ method: "GET", path: "/vault/" });
  });

  it("should_validate_RawApiCallSchema_with_body_and_accept", () => {
    const parsed = RawApiCallSchema.parse({ method: "POST", path: "/search/", body: { key: "val" }, accept: "application/json" });
    expect(parsed.method).toBe("POST");
    expect(parsed.body).toEqual({ key: "val" });
    expect(parsed.accept).toBe("application/json");
  });

  it("should_reject_invalid_method", () => {
    expect(() => RawApiCallSchema.parse({ method: "OPTIONS", path: "/" })).toThrow();
  });
});
