/**
 * Home Assistant REST API client. Long-lived access token.
 */
export interface HAClientConfig { accessToken: string; baseUrl: string; timeoutMs?: number; }

export class HAClient {
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: HAClientConfig) {
    if (!config.accessToken) throw new Error("HA_ACCESS_TOKEN is required");
    if (!config.baseUrl) throw new Error("HA_BASE_URL is required");
    this.accessToken = config.accessToken;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  async callApiRaw(path: string): Promise<{ base64: string; mimeType: string }> {
    const url = `${this.baseUrl}/api${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, { headers: { Authorization: `Bearer ${this.accessToken}` }, signal: controller.signal });
      if (!response.ok) throw new HAError(response.status, `Request failed: ${response.status}`);
      const buf = await response.arrayBuffer();
      const mimeType = response.headers.get("content-type") ?? "image/jpeg";
      return { base64: Buffer.from(buf).toString("base64"), mimeType };
    } finally { clearTimeout(timeout); }
  }

  async callApi<T = unknown>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, body?: Record<string, unknown>, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    let url = `${this.baseUrl}/api${path}`;
    if (query) { const p = new URLSearchParams(); for (const [k, v] of Object.entries(query)) { if (v !== undefined && v !== null) p.append(k, String(v)); } const qs = p.toString(); if (qs) url += `?${qs}`; }
    const headers: Record<string, string> = { Authorization: `Bearer ${this.accessToken}` };
    let fetchBody: BodyInit | undefined;
    if (body && method !== "GET") { headers["Content-Type"] = "application/json"; fetchBody = JSON.stringify(body); }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, { method, headers, body: fetchBody, signal: controller.signal });
      if (response.status === 204) return undefined as T;
      const ct = response.headers.get("content-type") ?? "";
      const data = ct.includes("json") ? await response.json() : await response.text();
      if (!response.ok) throw new HAError(response.status, typeof data === "string" ? data : (data as { message?: string }).message ?? "Unknown");
      return data as T;
    } finally { clearTimeout(timeout); }
  }
}

export class HAError extends Error {
  constructor(public readonly status: number, public readonly description: string) { super(`HA error ${status}: ${description}`); this.name = "HAError"; }
}
