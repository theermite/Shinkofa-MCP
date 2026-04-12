import { describe, it, expect } from "vitest";
import {
  PublishPostSchema,
  UpdatePostSchema,
  CreateDraftSchema,
  CreateSeriesSchema,
  AddCommentSchema,
  RawGraphQLSchema,
  GetPostSchema,
  ListPostsSchema,
} from "../src/lib/schemas.js";

describe("PublishPostSchema", () => {
  it("should_accept_valid_post", () => {
    expect(
      PublishPostSchema.safeParse({
        publicationId: "pub1",
        title: "My Post",
        contentMarkdown: "# Hello",
      }).success,
    ).toBe(true);
  });

  it("should_reject_empty_title", () => {
    expect(
      PublishPostSchema.safeParse({
        publicationId: "pub1",
        title: "",
        contentMarkdown: "content",
      }).success,
    ).toBe(false);
  });

  it("should_accept_tags_as_objects", () => {
    expect(
      PublishPostSchema.safeParse({
        publicationId: "pub1",
        title: "Test",
        contentMarkdown: "c",
        tags: [{ name: "JavaScript", slug: "javascript" }],
      }).success,
    ).toBe(true);
  });
});

describe("UpdatePostSchema", () => {
  it("should_require_id", () => {
    expect(UpdatePostSchema.safeParse({ title: "up" }).success).toBe(false);
  });

  it("should_accept_id_with_fields", () => {
    expect(
      UpdatePostSchema.safeParse({ id: "p1", title: "up" }).success,
    ).toBe(true);
  });
});

describe("CreateDraftSchema", () => {
  it("should_accept_valid_draft", () => {
    expect(
      CreateDraftSchema.safeParse({
        publicationId: "pub1",
        title: "Draft",
      }).success,
    ).toBe(true);
  });
});

describe("CreateSeriesSchema", () => {
  it("should_accept_valid_series", () => {
    expect(
      CreateSeriesSchema.safeParse({
        publicationId: "pub1",
        name: "My Series",
        slug: "my-series",
      }).success,
    ).toBe(true);
  });
});

describe("AddCommentSchema", () => {
  it("should_require_postId_and_content", () => {
    expect(
      AddCommentSchema.safeParse({
        postId: "p1",
        contentMarkdown: "Nice!",
      }).success,
    ).toBe(true);
  });
});

describe("GetPostSchema", () => {
  it("should_accept_host_and_slug", () => {
    expect(
      GetPostSchema.safeParse({ host: "blog.test.com", slug: "my-post" })
        .success,
    ).toBe(true);
  });
});

describe("ListPostsSchema", () => {
  it("should_accept_host_only", () => {
    expect(
      ListPostsSchema.safeParse({ host: "blog.test.com" }).success,
    ).toBe(true);
  });

  it("should_reject_first_over_50", () => {
    expect(
      ListPostsSchema.safeParse({ host: "x", first: 100 }).success,
    ).toBe(false);
  });
});

describe("RawGraphQLSchema", () => {
  it("should_accept_query_string", () => {
    expect(
      RawGraphQLSchema.safeParse({ query: "query { me { id } }" }).success,
    ).toBe(true);
  });

  it("should_accept_with_variables", () => {
    expect(
      RawGraphQLSchema.safeParse({
        query: "query($id: ID!) { post(id: $id) { title } }",
        variables: { id: "123" },
      }).success,
    ).toBe(true);
  });
});
