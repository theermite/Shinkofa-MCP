import { z } from "zod";

export const CreateTextPostSchema = z.object({
  author: z
    .string()
    .describe("Author URN, e.g. urn:li:person:abc123"),
  commentary: z
    .string()
    .min(1)
    .max(3000)
    .describe("Post text content (max 3000 chars)"),
  visibility: z
    .enum(["PUBLIC", "CONNECTIONS"])
    .default("PUBLIC")
    .describe("Post visibility"),
});

export const CreateArticlePostSchema = z.object({
  author: z
    .string()
    .describe("Author URN, e.g. urn:li:person:abc123"),
  commentary: z
    .string()
    .max(3000)
    .default("")
    .describe("Optional commentary text"),
  articleUrl: z
    .string()
    .url()
    .describe("URL of the article to share"),
  articleTitle: z
    .string()
    .optional()
    .describe("Optional title override for the article"),
  articleDescription: z
    .string()
    .optional()
    .describe("Optional description override for the article"),
  visibility: z
    .enum(["PUBLIC", "CONNECTIONS"])
    .default("PUBLIC")
    .describe("Post visibility"),
});

export const InitializeImageUploadSchema = z.object({
  owner: z
    .string()
    .describe("Owner URN, e.g. urn:li:person:abc123"),
});

export const CreateImagePostSchema = z.object({
  author: z
    .string()
    .describe("Author URN, e.g. urn:li:person:abc123"),
  commentary: z
    .string()
    .max(3000)
    .default("")
    .describe("Optional commentary text"),
  imageUrn: z
    .string()
    .describe("Image URN returned from initialize_image_upload"),
  altText: z
    .string()
    .optional()
    .describe("Alt text for the image (accessibility)"),
  visibility: z
    .enum(["PUBLIC", "CONNECTIONS"])
    .default("PUBLIC")
    .describe("Post visibility"),
});

export const DeletePostSchema = z.object({
  postUrn: z
    .string()
    .describe("Full post URN, e.g. urn:li:share:123456"),
});

export const RawApiCallSchema = z.object({
  method: z
    .enum(["GET", "POST", "PUT", "DELETE"])
    .describe("HTTP method"),
  path: z
    .string()
    .describe("API path, e.g. /rest/posts"),
  body: z
    .record(z.unknown())
    .optional()
    .describe("Request body for POST/PUT"),
});
