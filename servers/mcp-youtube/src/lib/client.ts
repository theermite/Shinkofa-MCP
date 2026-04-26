/**
 * YouTube Data API v3 client. API key for public data, OAuth2 for private.
 */
export interface YouTubeClientConfig {
  apiKey?: string;
  accessToken?: string;
  apiBaseUrl?: string;
  timeoutMs?: number;
}

export class YouTubeClient {
  private readonly apiKey: string | undefined;
  private readonly accessToken: string | undefined;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: YouTubeClientConfig) {
    if (!config.apiKey && !config.accessToken) throw new Error("YOUTUBE_API_KEY or GOOGLE_ACCESS_TOKEN is required");
    this.apiKey = config.apiKey;
    this.accessToken = config.accessToken;
    this.baseUrl = config.apiBaseUrl ?? "https://www.googleapis.com/youtube/v3";
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  async callApi<T = unknown>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: Record<string, unknown>,
    query?: Record<string, string | number | boolean | string[] | undefined>,
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    const params = new URLSearchParams();
    if (this.apiKey && !this.accessToken) params.append("key", this.apiKey);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v))
          v.forEach((i) => {
            params.append(k, i);
          });
        else params.append(k, String(v));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
    const headers: Record<string, string> = {};
    if (this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`;
    let fetchBody: BodyInit | undefined;
    if (body && method !== "GET") {
      headers["Content-Type"] = "application/json";
      fetchBody = JSON.stringify(body);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, { method, headers, body: fetchBody, signal: controller.signal });
      if (response.status === 204) return undefined as T;
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        throw new YouTubeError(response.status, `Non-JSON response (${response.status})`);
      }
      if (!response.ok) {
        const err = (data as { error?: { code?: number; message?: string } }).error;
        throw new YouTubeError(err?.code ?? response.status, err?.message ?? response.statusText);
      }
      return data as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class YouTubeError extends Error {
  constructor(
    public readonly code: number,
    public readonly description: string,
  ) {
    super(`YouTube error ${code}: ${description}`);
    this.name = "YouTubeError";
  }
}
