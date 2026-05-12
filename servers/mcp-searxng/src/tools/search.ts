import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SearxngClient } from "../lib/client.js";
import { NewsSearchSchema, WebSearchSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerSearchTools(server: McpServer, client: SearxngClient): void {
  server.tool(
    "searxng_web_search",
    "General web search across aggregated engines (Google/Bing/DuckDuckGo/Qwant/...). " +
      "Returns ranked results with title, URL, and snippet. Privacy-respecting — no query tracking.",
    WebSearchSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const data = await client.search({
          query: p.query,
          count: p.count ?? 10,
          categories: ["general"],
          language: p.language,
          pageno: p.pageno,
          safesearch: p.safesearch,
        });
        return toolResult({
          query: data.query,
          count: data.results?.length ?? 0,
          results: (data.results ?? []).map((r) => ({
            title: r.title,
            url: r.url,
            snippet: r.content ?? "",
            engine: r.engine,
          })),
          suggestions: data.suggestions ?? [],
          answers: data.answers ?? [],
        });
      }),
  );

  server.tool(
    "searxng_news_search",
    "Recent news search across news engines (Google News, Bing News, Yahoo News, ...). " +
      "Filtered by recency. Use 'timeRange' to control time window (default: last week).",
    NewsSearchSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const data = await client.search({
          query: p.query,
          count: p.count ?? 10,
          categories: ["news"],
          language: p.language,
          timeRange: p.timeRange ?? "week",
        });
        return toolResult({
          query: data.query,
          count: data.results?.length ?? 0,
          timeRange: p.timeRange ?? "week",
          results: (data.results ?? []).map((r) => ({
            title: r.title,
            url: r.url,
            snippet: r.content ?? "",
            engine: r.engine,
            publishedDate: r.publishedDate ?? null,
          })),
        });
      }),
  );
}
