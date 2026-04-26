/**
 * Zod schemas for Hashnode MCP tool inputs.
 */
import { z } from "zod";

// ── Publications ──

export const GetPublicationSchema = z.object({
  host: z.string().describe("Publication host (e.g. 'blog.example.com')"),
});

// ── Posts ──

export const GetPostSchema = z.object({
  host: z.string().describe("Publication host"),
  slug: z.string().describe("Post URL slug"),
});

export const ListPostsSchema = z.object({
  host: z.string().describe("Publication host"),
  first: z.number().max(50).optional().describe("Number of posts to fetch (max 50)"),
  after: z.string().optional().describe("Cursor for pagination (endCursor from previous page)"),
});

export const SearchPostsSchema = z.object({
  publicationId: z.string().describe("Publication ID"),
  query: z.string().describe("Search query"),
  first: z.number().max(50).optional().describe("Max results"),
  after: z.string().optional().describe("Pagination cursor"),
});

export const TagInput = z.object({
  name: z.string().describe("Tag name"),
  slug: z.string().describe("Tag slug"),
});

export const PublishPostSchema = z.object({
  publicationId: z.string().describe("Publication ID"),
  title: z.string().min(1).describe("Post title"),
  contentMarkdown: z.string().describe("Post content in Markdown"),
  subtitle: z.string().optional().describe("Post subtitle"),
  slug: z.string().optional().describe("Custom URL slug"),
  originalArticleURL: z.string().optional().describe("Canonical URL for cross-posted content"),
  coverImageURL: z.string().optional().describe("Cover image URL"),
  tags: z.array(TagInput).optional().describe("Tags as {name, slug} objects (NOT strings)"),
  seriesId: z.string().optional().describe("Series ID to add post to"),
  disableComments: z.boolean().optional(),
  publishedAt: z.string().optional().describe("ISO date to backdate the post"),
});

export const UpdatePostSchema = z.object({
  id: z.string().describe("Post ID to update"),
  title: z.string().optional(),
  contentMarkdown: z.string().optional(),
  subtitle: z.string().optional(),
  slug: z.string().optional(),
  originalArticleURL: z.string().optional(),
  coverImageURL: z.string().optional(),
  tags: z.array(TagInput).optional(),
  seriesId: z.string().optional(),
  publishedAt: z.string().optional(),
});

export const RemovePostSchema = z.object({
  id: z.string().describe("Post ID to remove"),
});

// ── Drafts ──

export const CreateDraftSchema = z.object({
  publicationId: z.string().describe("Publication ID"),
  title: z.string().min(1).describe("Draft title"),
  contentMarkdown: z.string().optional().describe("Draft content in Markdown"),
  subtitle: z.string().optional(),
  slug: z.string().optional(),
  coverImageURL: z.string().optional(),
  tags: z.array(TagInput).optional(),
});

export const PublishDraftSchema = z.object({
  draftId: z.string().describe("Draft ID to publish"),
});

export const ScheduleDraftSchema = z.object({
  draftId: z.string().describe("Draft ID to schedule"),
  publishAt: z.string().describe("ISO date to publish"),
});

// ── Series ──

export const CreateSeriesSchema = z.object({
  publicationId: z.string().describe("Publication ID"),
  name: z.string().min(1).describe("Series name"),
  slug: z.string().describe("Series URL slug"),
  description: z.string().optional().describe("Series description in Markdown"),
  coverImage: z.string().optional().describe("Series cover image URL"),
});

export const AddToSeriesSchema = z.object({
  postId: z.string().describe("Post ID"),
  seriesId: z.string().describe("Series ID"),
});

// ── Comments ──

export const AddCommentSchema = z.object({
  postId: z.string().describe("Post ID"),
  contentMarkdown: z.string().describe("Comment content in Markdown"),
});

// ── Reactions ──

export const LikePostSchema = z.object({
  postId: z.string().describe("Post ID to like"),
});

// ── Raw ──

export const RawGraphQLSchema = z.object({
  query: z.string().describe("GraphQL query or mutation string"),
  variables: z.record(z.unknown()).optional().describe("GraphQL variables"),
});
