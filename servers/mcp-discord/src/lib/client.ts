/**
 * Discord REST API v10 client — thin typed wrapper over fetch.
 * Supports all REST methods via callApi().
 */

export interface DiscordClientConfig {
  botToken: string;
  apiBaseUrl?: string;
  timeoutMs?: number;
}

export interface DiscordApiError {
  code: number;
  message: string;
  errors?: Record<string, unknown>;
}

export class DiscordClient {
  private readonly baseUrl: string;
  private readonly botToken: string;
  private readonly timeoutMs: number;

  constructor(config: DiscordClientConfig) {
    if (!config.botToken) {
      throw new Error("DISCORD_BOT_TOKEN is required");
    }
    this.botToken = config.botToken;
    this.baseUrl = config.apiBaseUrl ?? "https://discord.com/api/v10";
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  /**
   * Call any Discord REST API endpoint.
   * @param method HTTP method (GET, POST, PUT, PATCH, DELETE)
   * @param path API path (e.g. "/channels/123/messages")
   * @param body Optional JSON body
   * @param query Optional query parameters
   * @param reason Optional audit log reason (X-Audit-Log-Reason header)
   */
  async callApi<T = unknown>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    body?: Record<string, unknown>,
    query?: Record<string, string | number | boolean | undefined>,
    reason?: string,
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;

    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bot ${this.botToken}`,
    };

    if (reason) {
      headers["X-Audit-Log-Reason"] = encodeURIComponent(reason);
    }

    let fetchBody: BodyInit | undefined;

    if (body && method !== "GET") {
      headers["Content-Type"] = "application/json";
      const cleaned = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined && v !== null));
      fetchBody = JSON.stringify(cleaned);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: fetchBody,
        signal: controller.signal,
      });

      // Handle rate limiting
      if (response.status === 429) {
        let rlData: { retry_after: number; global: boolean };
        try {
          rlData = (await response.json()) as { retry_after: number; global: boolean };
        } catch {
          throw new DiscordRateLimitError(5, false);
        }
        throw new DiscordRateLimitError(rlData.retry_after, rlData.global);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        throw new DiscordError(response.status, 0, `Non-JSON response (${response.status})`);
      }

      if (!response.ok) {
        const err = data as DiscordApiError;
        throw new DiscordError(response.status, err.code, err.message, err.errors);
      }

      return data as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class DiscordError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly code: number,
    public readonly description: string,
    public readonly errors?: Record<string, unknown>,
  ) {
    super(`Discord API error ${httpStatus} (${code}): ${description}`);
    this.name = "DiscordError";
  }
}

export class DiscordRateLimitError extends Error {
  constructor(
    public readonly retryAfter: number,
    public readonly global: boolean,
  ) {
    super(`Discord rate limit: retry after ${retryAfter}s${global ? " (global)" : ""}`);
    this.name = "DiscordRateLimitError";
  }
}
