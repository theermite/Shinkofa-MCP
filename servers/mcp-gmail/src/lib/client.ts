/**
 * Gmail API v1 client. OAuth2 Bearer token.
 */
export interface GmailClientConfig { accessToken: string; apiBaseUrl?: string; timeoutMs?: number; }

export class GmailClient {
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: GmailClientConfig) {
    if (!config.accessToken) throw new Error("GOOGLE_ACCESS_TOKEN is required");
    this.accessToken = config.accessToken;
    this.baseUrl = config.apiBaseUrl ?? "https://gmail.googleapis.com/gmail/v1";
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  async callApi<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: Record<string, unknown>, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (query) { const p = new URLSearchParams(); for (const [k, v] of Object.entries(query)) { if (v !== undefined && v !== null) p.append(k, String(v)); } const qs = p.toString(); if (qs) url += `?${qs}`; }
    const headers: Record<string, string> = { Authorization: `Bearer ${this.accessToken}` };
    let fetchBody: BodyInit | undefined;
    if (body && method !== "GET") { headers["Content-Type"] = "application/json"; fetchBody = JSON.stringify(body); }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, { method, headers, body: fetchBody, signal: controller.signal });
      if (response.status === 204) return undefined as T;
      const data = await response.json();
      if (!response.ok) { const err = (data as { error?: { code?: number; message?: string } }).error; throw new GmailError(err?.code ?? response.status, err?.message ?? response.statusText); }
      return data as T;
    } finally { clearTimeout(timeout); }
  }
}

export class GmailError extends Error {
  constructor(public readonly code: number, public readonly description: string) { super(`Gmail error ${code}: ${description}`); this.name = "GmailError"; }
}
