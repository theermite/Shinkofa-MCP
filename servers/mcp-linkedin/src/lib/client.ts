/**
 * LinkedIn REST API client — thin typed wrapper over fetch.
 * Uses OAuth2 Bearer token + versioned REST headers.
 */

export interface LinkedInClientConfig {
  accessToken: string;
  apiVersion?: string;
  timeoutMs?: number;
}

export class LinkedInClient {
  private readonly accessToken: string;
  private readonly apiVersion: string;
  private readonly timeoutMs: number;
  private readonly baseUrl = "https://api.linkedin.com";

  constructor(config: LinkedInClientConfig) {
    if (!config.accessToken) {
      throw new Error("LINKEDIN_ACCESS_TOKEN is required");
    }
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion ?? "202603";
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  async get<T = unknown>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async post<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async del(path: string): Promise<void> {
    await this.request("DELETE", path);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      "Linkedin-Version": this.apiVersion,
      "X-Restli-Protocol-Version": "2.0.0",
    };

    let reqBody: string | undefined;
    if (body) {
      headers["Content-Type"] = "application/json";
      reqBody = JSON.stringify(body);
    }

    if (method === "DELETE") {
      headers["X-RestLi-Method"] = "DELETE";
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
        throw new LinkedInError(res.status, message);
      }

      const text = await res.text();
      if (!text) return undefined as T;

      return JSON.parse(text) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class LinkedInError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(`LinkedIn error ${status}: ${detail}`);
    this.name = "LinkedInError";
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}
