/**
 * Gmail API v1 client. OAuth2 Bearer token with optional auto-refresh.
 */
export interface GmailClientConfig {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  apiBaseUrl?: string;
  timeoutMs?: number;
}

export class GmailClient {
  private accessToken: string;
  private readonly refreshToken?: string;
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: GmailClientConfig) {
    if (!config.accessToken) throw new Error("GOOGLE_ACCESS_TOKEN is required");
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.baseUrl = config.apiBaseUrl ?? "https://gmail.googleapis.com/gmail/v1";
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  private get canRefresh(): boolean {
    return !!(this.refreshToken && this.clientId && this.clientSecret);
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) {
      throw new GmailError(401, "Access token expired and no refresh token configured. Set GOOGLE_REFRESH_TOKEN, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET.");
    }
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });
    const data = await response.json() as { access_token?: string; error?: string; error_description?: string };
    if (!response.ok || !data.access_token) {
      throw new GmailError(401, `Token refresh failed: ${data.error_description ?? data.error ?? "unknown error"}`);
    }
    this.accessToken = data.access_token;
  }

  async callApi<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: Record<string, unknown>, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const result = await this.executeRequest<T>(method, path, body, query);

    if (result.status === 401 && this.canRefresh) {
      await this.refreshAccessToken();
      const retry = await this.executeRequest<T>(method, path, body, query);
      return this.handleResponse<T>(retry.response, retry.data);
    }

    return this.handleResponse<T>(result.response, result.data);
  }

  private async executeRequest<T>(method: string, path: string, body?: Record<string, unknown>, query?: Record<string, string | number | boolean | undefined>): Promise<{ response: Response; data: unknown; status: number }> {
    let url = `${this.baseUrl}${path}`;
    if (query) {
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) { for (const item of v) p.append(k, String(item)); }
        else { p.append(k, String(v)); }
      }
      const qs = p.toString();
      if (qs) url += `?${qs}`;
    }
    const headers: Record<string, string> = { Authorization: `Bearer ${this.accessToken}` };
    let fetchBody: BodyInit | undefined;
    if (body && method !== "GET") { headers["Content-Type"] = "application/json"; fetchBody = JSON.stringify(body); }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, { method, headers, body: fetchBody, signal: controller.signal });
      if (response.status === 204) return { response, data: undefined, status: 204 };
      const data = await response.json();
      return { response, data, status: response.status };
    } finally { clearTimeout(timeout); }
  }

  private handleResponse<T>(response: Response, data: unknown): T {
    if (response.status === 204) return undefined as T;
    if (!response.ok) {
      const err = (data as { error?: { code?: number; message?: string } }).error;
      throw new GmailError(err?.code ?? response.status, err?.message ?? response.statusText);
    }
    return data as T;
  }
}

export class GmailError extends Error {
  constructor(public readonly code: number, public readonly description: string) { super(`Gmail error ${code}: ${description}`); this.name = "GmailError"; }
}
