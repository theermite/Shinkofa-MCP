import { describe, it, expect } from "vitest";
import {
  ListArticlesSchema,
  GetArticleSchema,
  CreateArticleSchema,
  UpdateArticleSchema,
  ListMyArticlesSchema,
  ListCommentsSchema,
  GetCommentSchema,
  GetUserSchema,
  ToggleReactionSchema,
  RawApiCallSchema,
} from "../src/lib/schemas.js";

describe("ListArticlesSchema", () => {
  it("should_accept_empty_params", () => {
    expect(ListArticlesSchema.safeParse({}).success).toBe(true);
  });

  it("should_accept_tag_filter", () => {
    expect(
      ListArticlesSchema.safeParse({ tag: "javascript", page: 1 }).success,
    ).toBe(true);
  });
});

describe("CreateArticleSchema", () => {
  it("should_accept_valid_article", () => {
    const result = CreateArticleSchema.safeParse({
      title: "My Article",
      body_markdown: "# Hello\nContent here.",
    });
    expect(result.success).toBe(true);
  });

  it("should_reject_empty_title", () => {
    expect(
      CreateArticleSchema.safeParse({
        title: "",
        body_markdown: "content",
      }).success,
    ).toBe(false);
  });

  it("should_accept_full_article", () => {
    const result = CreateArticleSchema.safeParse({
      title: "Full Article",
      body_markdown: "content",
      published: true,
      tags: "javascript,webdev",
      canonical_url: "https://example.com/post",
      series: "My Series",
      main_image: "https://example.com/img.png",
      description: "A brief description",
    });
    expect(result.success).toBe(true);
  });
});

describe("UpdateArticleSchema", () => {
  it("should_require_id", () => {
    expect(
      UpdateArticleSchema.safeParse({ title: "updated" }).success,
    ).toBe(false);
  });

  it("should_accept_id_with_fields", () => {
    expect(
      UpdateArticleSchema.safeParse({ id: 42, title: "updated" }).success,
    ).toBe(true);
  });
});

describe("GetArticleSchema", () => {
  it("should_accept_valid_id", () => {
    expect(GetArticleSchema.safeParse({ id: 1 }).success).toBe(true);
  });
});

describe("ListMyArticlesSchema", () => {
  it("should_accept_published_status", () => {
    expect(
      ListMyArticlesSchema.safeParse({ status: "published" }).success,
    ).toBe(true);
  });
});

describe("ListCommentsSchema", () => {
  it("should_accept_article_id", () => {
    expect(
      ListCommentsSchema.safeParse({ a_id: 42 }).success,
    ).toBe(true);
  });

  it("should_reject_missing_both_ids", () => {
    expect(ListCommentsSchema.safeParse({}).success).toBe(false);
  });
});

describe("GetCommentSchema", () => {
  it("should_accept_string_id", () => {
    expect(GetCommentSchema.safeParse({ id: "abc" }).success).toBe(true);
  });
});

describe("GetUserSchema", () => {
  it("should_accept_numeric_id", () => {
    expect(GetUserSchema.safeParse({ id: 1 }).success).toBe(true);
  });
});

describe("ToggleReactionSchema", () => {
  it("should_accept_valid_reaction", () => {
    const result = ToggleReactionSchema.safeParse({
      reactable_id: 1,
      reactable_type: "Article",
      category: "like",
    });
    expect(result.success).toBe(true);
  });

  it("should_reject_invalid_category", () => {
    const result = ToggleReactionSchema.safeParse({
      reactable_id: 1,
      reactable_type: "Article",
      category: "love",
    });
    expect(result.success).toBe(false);
  });
});

describe("RawApiCallSchema", () => {
  it("should_accept_get", () => {
    expect(
      RawApiCallSchema.safeParse({ method: "GET", path: "/api/tags" }).success,
    ).toBe(true);
  });

  it("should_reject_delete_method", () => {
    expect(
      RawApiCallSchema.safeParse({ method: "DELETE", path: "/api/x" }).success,
    ).toBe(false);
  });
});
