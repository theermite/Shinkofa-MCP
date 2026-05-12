/**
 * SearXNG HTTP client — thin typed wrapper over fetch.
 * SearXNG exposes /search with format=json for programmatic access.
 *
 * Endpoint: http://<host>:<port>/search?q=<query>&format=json&...
 *
 * SearXNG must be configured to allow JSON output:
 *   settings.yml: search.formats: [html, json]
 */

export interface SearxngClientConfig {
  baseUrl?: string;
  timeoutMs?: number;
}

export interface SearxngResult {
  url: string;
  title: string;
  content?: string;
  engine?: string;
  category?: string;
  publishedDate?: string | null;
  score?: number;
}

export interface SearxngSearchResponse {
  query: string;
  number_of_results: number;
  results: SearxngResult[];
  answers?: string[];
  corrections?: string[];
  infoboxes?: unknown[];
  suggestions?: string[];
  unresponsive_engines?: unknown[];
}

export interface SearchOptions {
  query: string;
  count?: number;
  categories?: string[];
  engines?: string[];
  language?: string;
  pageno?: number;
  timeRange?: "day" | "week" | "month" | "year";
  safesearch?: 0 | 1 | 2;
}

export class SearxngClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: SearxngClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? "http://localhost:8080").replace(/\/$/, "");
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  async search(opts: SearchOptions): Promise<SearxngSearchResponse> {
    const params = new URLSearchParams();
    params.set("q", opts.query);
    params.set("format", "json");
    if (opts.categories?.length) params.set("categories", opts.categories.join(","));
    if (opts.engines?.length) params.set("engines", opts.engines.join(","));
    if (opts.language) params.set("language", opts.language);
    if (opts.pageno !== undefined) params.set("pageno", String(opts.pageno));
    if (opts.timeRange) params.set("time_range", opts.timeRange);
    if (opts.safesearch !== undefined) params.set("safesearch", String(opts.safesearch));

    const url = `${this.baseUrl}/search?${params.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          // SearXNG requires a user-agent header
          "User-Agent": "shinkofa-mcp-searxng/1.0",
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        let message: string;
        try {
          const text = await res.text();
          message = text.slice(0, 500);
        } catch {
          message = `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new SearxngError(res.status, message);
      }

      const data = (await res.json()) as SearxngSearchResponse;

      // Apply count limit client-side (SearXNG returns up to ~30 by default)
      if (opts.count !== undefined && data.results) {
        data.results = data.results.slice(0, opts.count);
      }

      return data;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class SearxngError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(`SearXNG error ${status}: ${detail}`);
    this.name = "SearxngError";
  }
}
