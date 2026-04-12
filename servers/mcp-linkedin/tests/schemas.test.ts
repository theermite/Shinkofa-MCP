import { describe, it, expect } from "vitest";
import {
  CreateTextPostSchema,
  CreateArticlePostSchema,
  InitializeImageUploadSchema,
  CreateImagePostSchema,
  DeletePostSchema,
  RawApiCallSchema,
} from "../src/lib/schemas.js";

describe("CreateTextPostSchema", () => {
  it("should_accept_valid_text_post", () => {
    expect(
      CreateTextPostSchema.safeParse({
        author: "urn:li:person:abc123",
        commentary: "Hello LinkedIn!",
      }).success,
    ).toBe(true);
  });

  it("should_reject_empty_commentary", () => {
    expect(
      CreateTextPostSchema.safeParse({
        author: "urn:li:person:abc123",
        commentary: "",
      }).success,
    ).toBe(false);
  });

  it("should_default_visibility_to_public", () => {
    const result = CreateTextPostSchema.parse({
      author: "urn:li:person:abc123",
      commentary: "test",
    });
    expect(result.visibility).toBe("PUBLIC");
  });

  it("should_accept_connections_visibility", () => {
    expect(
      CreateTextPostSchema.safeParse({
        author: "urn:li:person:abc123",
        commentary: "test",
        visibility: "CONNECTIONS",
      }).success,
    ).toBe(true);
  });
});

describe("CreateArticlePostSchema", () => {
  it("should_accept_valid_article_post", () => {
    expect(
      CreateArticlePostSchema.safeParse({
        author: "urn:li:person:abc123",
        articleUrl: "https://blog.test.com/my-post",
      }).success,
    ).toBe(true);
  });

  it("should_reject_invalid_url", () => {
    expect(
      CreateArticlePostSchema.safeParse({
        author: "urn:li:person:abc123",
        articleUrl: "not-a-url",
      }).success,
    ).toBe(false);
  });

  it("should_accept_optional_title_and_description", () => {
    const result = CreateArticlePostSchema.parse({
      author: "urn:li:person:abc123",
      articleUrl: "https://blog.test.com/post",
      articleTitle: "My Post",
      articleDescription: "A great post",
    });
    expect(result.articleTitle).toBe("My Post");
    expect(result.articleDescription).toBe("A great post");
  });
});

describe("InitializeImageUploadSchema", () => {
  it("should_accept_owner_urn", () => {
    expect(
      InitializeImageUploadSchema.safeParse({
        owner: "urn:li:person:abc123",
      }).success,
    ).toBe(true);
  });
});

describe("CreateImagePostSchema", () => {
  it("should_accept_valid_image_post", () => {
    expect(
      CreateImagePostSchema.safeParse({
        author: "urn:li:person:abc123",
        imageUrn: "urn:li:image:abc",
        altText: "A picture",
      }).success,
    ).toBe(true);
  });

  it("should_accept_without_alt_text", () => {
    expect(
      CreateImagePostSchema.safeParse({
        author: "urn:li:person:abc123",
        imageUrn: "urn:li:image:abc",
      }).success,
    ).toBe(true);
  });
});

describe("DeletePostSchema", () => {
  it("should_accept_post_urn", () => {
    expect(
      DeletePostSchema.safeParse({
        postUrn: "urn:li:share:123456",
      }).success,
    ).toBe(true);
  });
});

describe("RawApiCallSchema", () => {
  it("should_accept_get_request", () => {
    expect(
      RawApiCallSchema.safeParse({
        method: "GET",
        path: "/rest/posts",
      }).success,
    ).toBe(true);
  });

  it("should_accept_post_with_body", () => {
    expect(
      RawApiCallSchema.safeParse({
        method: "POST",
        path: "/rest/posts",
        body: { commentary: "test" },
      }).success,
    ).toBe(true);
  });

  it("should_reject_invalid_method", () => {
    expect(
      RawApiCallSchema.safeParse({
        method: "PATCH",
        path: "/test",
      }).success,
    ).toBe(false);
  });
});
