/**
 * n8n REST API client. API key auth.
 */
export interface N8nClientConfig { apiKey: string; baseUrl: string; timeoutMs?: number; }

export class N8nClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: N8nClientConfig) {
    if (!config.apiKey) throw new Error("N8N_API_KEY is required");
    if (!config.baseUrl) throw new Error("N8N_BASE_URL is required");
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  async callApi<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: Record<string, unknown>, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    let url = `${this.baseUrl}/api/v1${path}`;
    if (query) { const p = new URLSearchParams(); for (const [k, v] of Object.entries(query)) { if (v !== undefined) p.append(k, String(v)); } const qs = p.toString(); if (qs) url += `?${qs}`; }
    const headers: Record<string, string> = { "X-N8N-API-KEY": this.apiKey };
    let fetchBody: BodyInit | undefined;
    if (body && method !== "GET") { headers["Content-Type"] = "application/json"; fetchBody = JSON.stringify(body); }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, { method, headers, body: fetchBody, signal: controller.signal });
      if (response.status === 204) return undefined as T;
      const data = await response.json();
      if (!response.ok) throw new N8nError(response.status, (data as { message?: string }).message ?? response.statusText);
      return data as T;
    } finally { clearTimeout(timeout); }
  }
}

export class N8nError extends Error {
  constructor(public readonly status: number, public readonly description: string) { super(`n8n error ${status}: ${description}`); this.name = "N8nError"; }
}
