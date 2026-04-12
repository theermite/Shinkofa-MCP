/**
 * Zod schemas for DEV.to MCP tool inputs.
 */
import { z } from "zod";

// ── Common ──

export const Pagination = z.object({
  page: z.number().optional().describe("Page number (default: 1)"),
  per_page: z
    .number()
    .max(1000)
    .optional()
    .describe("Items per page (default: 30, max: 1000)"),
});

// ── Articles ──

export const ListArticlesSchema = Pagination.extend({
  tag: z.string().optional().describe("Filter by tag"),
  tags: z.string().optional().describe("Comma-separated tags (AND)"),
  tags_exclude: z
    .string()
    .optional()
    .describe("Comma-separated tags to exclude"),
  username: z.string().optional().describe("Filter by author username"),
  state: z
    .enum(["fresh", "rising", "all"])
    .optional()
    .describe("Article state filter"),
  top: z
    .number()
    .optional()
    .describe("Top articles in last N days"),
  collection_id: z
    .number()
    .optional()
    .describe("Filter by collection/series"),
});

export const GetArticleSchema = z.object({
  id: z.number().describe("Article ID"),
});

export const GetArticleByPathSchema = z.object({
  username: z.string().describe("Author username"),
  slug: z.string().describe("Article slug"),
});

export const CreateArticleSchema = z.object({
  title: z.string().min(1).describe("Article title"),
  body_markdown: z.string().describe("Article content in Markdown"),
  published: z
    .boolean()
    .optional()
    .describe("Publish immediately (default: false = draft)"),
  tags: z
    .string()
    .optional()
    .describe("Comma-separated tags (max 4)"),
  canonical_url: z
    .string()
    .optional()
    .describe("Original URL for cross-posted content"),
  series: z
    .string()
    .optional()
    .describe("Series name to group articles"),
  main_image: z.string().optional().describe("Cover image URL"),
  description: z
    .string()
    .optional()
    .describe("Brief description / subtitle"),
  organization_id: z
    .number()
    .optional()
    .describe("Publish under an organization"),
});

export const UpdateArticleSchema = z.object({
  id: z.number().describe("Article ID to update"),
  title: z.string().optional().describe("Updated title"),
  body_markdown: z.string().optional().describe("Updated Markdown content"),
  published: z.boolean().optional().describe("Publish or unpublish"),
  tags: z.string().optional().describe("Updated tags (comma-separated)"),
  canonical_url: z.string().optional(),
  series: z.string().optional(),
  main_image: z.string().optional(),
  description: z.string().optional(),
  organization_id: z.number().optional(),
});

export const ListMyArticlesSchema = Pagination.extend({
  status: z
    .enum(["published", "unpublished", "all"])
    .optional()
    .describe("Filter: published, unpublished, or all (default: all)"),
});

// ── Comments ──

export const ListCommentsSchema = z
  .object({
    a_id: z
      .number()
      .optional()
      .describe("Article ID to list comments for"),
    p_id: z
      .number()
      .optional()
      .describe("Podcast episode ID to list comments for"),
  })
  .refine((d) => d.a_id !== undefined || d.p_id !== undefined, {
    message: "Either a_id or p_id is required",
  });

export const GetCommentSchema = z.object({
  id: z.string().describe("Comment ID"),
});

// ── Users ──

export const GetUserSchema = z.object({
  id: z.number().describe("User ID"),
});

// ── Tags ──

export const ListTagsSchema = Pagination;

// ── Reactions ──

export const ToggleReactionSchema = z.object({
  reactable_id: z.number().describe("Article or comment ID"),
  reactable_type: z
    .enum(["Article", "Comment"])
    .describe("Type of reactable"),
  category: z
    .enum([
      "like",
      "unicorn",
      "readinglist",
      "thumbsup",
      "thumbsdown",
      "vomit",
    ])
    .describe("Reaction category"),
});

// ── Raw ──

export const RawApiCallSchema = z.object({
  method: z.enum(["GET", "POST", "PUT"]).describe("HTTP method"),
  path: z
    .string()
    .min(1)
    .describe("API path (e.g. '/api/articles')"),
  body: z.record(z.unknown()).optional().describe("JSON request body"),
});
