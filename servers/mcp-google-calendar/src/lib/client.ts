/**
 * Google Calendar API v3 client.
 * Uses OAuth2 access token (refreshed externally or via service account).
 */

export interface GoogleCalendarClientConfig {
  accessToken: string;
  apiBaseUrl?: string;
  timeoutMs?: number;
}

export class GoogleCalendarClient {
  private readonly accessToken: string;
  private readonly apiBaseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: GoogleCalendarClientConfig) {
    if (!config.accessToken) {
      throw new Error("GOOGLE_ACCESS_TOKEN is required");
    }
    this.accessToken = config.accessToken;
    this.apiBaseUrl = config.apiBaseUrl ?? "https://www.googleapis.com/calendar/v3";
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  async callApi<T = unknown>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    body?: Record<string, unknown>,
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    let url = `${this.apiBaseUrl}${path}`;

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
      Authorization: `Bearer ${this.accessToken}`,
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
      const response = await fetch(url, { method, headers, body: fetchBody, signal: controller.signal });

      if (response.status === 204) return undefined as T;

      const data = await response.json();

      if (!response.ok) {
        const err = (data as { error?: { code?: number; message?: string } }).error;
        throw new GoogleCalendarError(err?.code ?? response.status, err?.message ?? response.statusText);
      }

      return data as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class GoogleCalendarError extends Error {
  constructor(public readonly code: number, public readonly description: string) {
    super(`Google Calendar error ${code}: ${description}`);
    this.name = "GoogleCalendarError";
  }
}
