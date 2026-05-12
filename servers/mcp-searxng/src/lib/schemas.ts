/**
 * Zod schemas for SearXNG MCP tool inputs.
 */
import { z } from "zod";

export const WebSearchSchema = z.object({
  query: z.string().min(1).describe("Search query (natural language)"),
  count: z
    .number()
    .int()
    .positive()
    .max(50)
    .optional()
    .describe("Max number of results to return (default: 10, max: 50)"),
  language: z
    .string()
    .optional()
    .describe("Result language code (e.g. 'en', 'fr', 'es', 'all'). Default: SearXNG instance default."),
  pageno: z.number().int().positive().optional().describe("Pagination — page number (default: 1)"),
  safesearch: z
    .union([z.literal(0), z.literal(1), z.literal(2)])
    .optional()
    .describe("Safe search level: 0=off, 1=moderate, 2=strict"),
});

export const NewsSearchSchema = z.object({
  query: z.string().min(1).describe("News search query"),
  count: z.number().int().positive().max(50).optional().describe("Max results (default: 10, max: 50)"),
  language: z.string().optional().describe("Language code (e.g. 'en', 'fr')"),
  timeRange: z
    .enum(["day", "week", "month", "year"])
    .optional()
    .describe("Recency filter: 'day' for last 24h, 'week' for last 7 days, etc. Default: 'week'"),
});
