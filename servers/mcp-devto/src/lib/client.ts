/**
 * DEV.to (Forem) API client — thin typed wrapper over fetch.
 * All authenticated requests use api-key header.
 */

export interface DevtoClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export class DevtoClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(config: DevtoClientConfig) {
    if (!config.apiKey) {
      throw new Error("DEVTO_API_KEY is required");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? "https://dev.to").replace(/\/$/, "");
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

  async put<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>("PUT", path, body);
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
      "api-key": this.apiKey,
      Accept: "application/vnd.forem.api-v1+json",
    };

    let reqBody: string | undefined;
    if (body) {
      headers["Content-Type"] = "application/json";
      reqBody = JSON.stringify(body);
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
          const data = (await res.json()) as { error?: string };
          message = data.error ?? `HTTP ${res.status}`;
        } catch {
          message = `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new DevtoError(res.status, message);
      }

      const text = await res.text();
      if (!text) return undefined as T;

      return JSON.parse(text) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class DevtoError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(`DEV.to error ${status}: ${detail}`);
    this.name = "DevtoError";
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}
