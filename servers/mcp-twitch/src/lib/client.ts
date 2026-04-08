/**
 * Twitch Helix API client — thin typed wrapper over fetch.
 * Handles OAuth2 app access token refresh automatically.
 */

export interface TwitchClientConfig {
  clientId: string;
  clientSecret?: string;
  accessToken?: string;
  apiBaseUrl?: string;
  timeoutMs?: number;
}

export class TwitchClient {
  private readonly clientId: string;
  private readonly clientSecret: string | undefined;
  private readonly apiBaseUrl: string;
  private readonly timeoutMs: number;
  private accessToken: string | undefined;
  private tokenExpiresAt = 0;

  constructor(config: TwitchClientConfig) {
    if (!config.clientId) {
      throw new Error("TWITCH_CLIENT_ID is required");
    }
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.accessToken = config.accessToken;
    this.apiBaseUrl = config.apiBaseUrl ?? "https://api.twitch.tv/helix";
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  /**
   * Get a valid access token, refreshing if needed.
   * If a user access token was provided, uses it directly.
   * Otherwise, obtains an app access token via client credentials.
   */
  private async getToken(): Promise<string> {
    if (this.accessToken && (this.tokenExpiresAt === 0 || Date.now() < this.tokenExpiresAt)) {
      return this.accessToken;
    }

    if (!this.clientSecret) {
      throw new Error("No access token available and no client secret for app token refresh");
    }

    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      throw new TwitchError(response.status, `Token refresh failed: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      token_type: string;
    };

    this.accessToken = data.access_token;
    // Refresh 60s before expiry
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

    return this.accessToken;
  }

  /**
   * Call any Twitch Helix API endpoint.
   * @param method HTTP method
   * @param path API path (e.g. "/channels" — without base URL)
   * @param body Optional JSON body (for POST/PUT/PATCH)
   * @param query Optional query parameters
   */
  async callApi<T = unknown>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    body?: Record<string, unknown>,
    query?: Record<string, string | number | boolean | string[] | undefined>,
  ): Promise<T> {
    const token = await this.getToken();

    let url = `${this.apiBaseUrl}${path}`;

    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const v of value) {
            params.append(key, String(v));
          }
        } else {
          params.append(key, String(value));
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Client-Id": this.clientId,
    };

    let fetchBody: BodyInit | undefined;

    if (body && method !== "GET") {
      headers["Content-Type"] = "application/json";
      const cleaned = Object.fromEntries(
        Object.entries(body).filter(([, v]) => v !== undefined && v !== null),
      );
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
        const resetEpoch = response.headers.get("Ratelimit-Reset");
        const retryAfter = resetEpoch
          ? Math.max(0, parseInt(resetEpoch, 10) - Math.floor(Date.now() / 1000))
          : 60;
        throw new TwitchRateLimitError(retryAfter);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new TwitchError(
          response.status,
          (data as { message?: string }).message ?? response.statusText,
        );
      }

      return data as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class TwitchError extends Error {
  constructor(
    public readonly status: number,
    public readonly description: string,
  ) {
    super(`Twitch API error ${status}: ${description}`);
    this.name = "TwitchError";
  }
}

export class TwitchRateLimitError extends Error {
  constructor(public readonly retryAfter: number) {
    super(`Twitch rate limit: retry after ${retryAfter}s`);
    this.name = "TwitchRateLimitError";
  }
}
