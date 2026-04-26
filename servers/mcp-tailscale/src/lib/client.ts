/**
 * Tailscale API v2 client — thin typed wrapper over fetch.
 * Uses Bearer token auth. Base URL: https://api.tailscale.com
 */

export interface TailscaleClientConfig {
  apiKey: string;
  tailnet?: string;
  timeoutMs?: number;
}

export class TailscaleClient {
  private readonly apiKey: string;
  public readonly tailnet: string;
  private readonly timeoutMs: number;
  private readonly baseUrl = "https://api.tailscale.com";

  constructor(config: TailscaleClientConfig) {
    if (!config.apiKey) {
      throw new Error("TAILSCALE_API_KEY is required");
    }
    this.apiKey = config.apiKey;
    this.tailnet = config.tailnet ?? "-";
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  async get<T = unknown>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async post<T = unknown>(path: string, body?: Record<string, unknown>, contentType?: string): Promise<T> {
    return this.request<T>("POST", path, body, contentType);
  }

  async del<T = unknown>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown> | string,
    contentType?: string,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    let reqBody: string | undefined;
    if (body !== undefined) {
      if (typeof body === "string") {
        headers["Content-Type"] = contentType ?? "text/plain";
        reqBody = body;
      } else {
        headers["Content-Type"] = contentType ?? "application/json";
        reqBody = JSON.stringify(body);
      }
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: reqBody,
        signal: controller.signal,
      });

      if (!res.ok) {
        let message: string;
        try {
          const data = (await res.json()) as { message?: string };
          message = data.message ?? `HTTP ${res.status}`;
        } catch {
          message = `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new TailscaleError(res.status, message);
      }

      const text = await res.text();
      if (!text) return undefined as T;

      try {
        return JSON.parse(text) as T;
      } catch {
        return text as unknown as T;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  tailnetPath(suffix: string): string {
    return `/api/v2/tailnet/${encodeURIComponent(this.tailnet)}${suffix}`;
  }
}

export class TailscaleError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(`Tailscale error ${status}: ${detail}`);
    this.name = "TailscaleError";
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }
}
