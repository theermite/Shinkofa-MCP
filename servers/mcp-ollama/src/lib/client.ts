/**
 * Ollama REST API client — thin typed wrapper over fetch.
 * All endpoints force stream: false for MCP tool responses.
 */

export interface OllamaClientConfig {
  baseUrl?: string;
  timeoutMs?: number;
}

export class OllamaClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: OllamaClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? "http://localhost:11434").replace(
      /\/$/,
      "",
    );
    this.timeoutMs = config.timeoutMs ?? 120_000;
  }

  async post<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async get<T = unknown>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async del<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>("DELETE", path, body);
  }

  async head(path: string): Promise<{ exists: boolean; status: number }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: "HEAD",
        signal: controller.signal,
      });
      return { exists: res.ok, status: res.status };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {};
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
        throw new OllamaError(res.status, message);
      }

      // 204 or empty body
      const text = await res.text();
      if (!text) return undefined as T;

      return JSON.parse(text) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class OllamaError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(`Ollama error ${status}: ${detail}`);
    this.name = "OllamaError";
  }
}
