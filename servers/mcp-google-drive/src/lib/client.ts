/**
 * Google Drive API v3 client.
 * OAuth2 access token with optional auto-refresh.
 * Handles two base URLs: metadata vs upload.
 */

export interface DriveClientConfig {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  timeoutMs?: number;
}

const API_BASE = "https://www.googleapis.com/drive/v3";
const UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";

export class DriveClient {
  private accessToken: string;
  private readonly refreshToken?: string;
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly timeoutMs: number;

  constructor(config: DriveClientConfig) {
    if (!config.accessToken) throw new Error("GOOGLE_ACCESS_TOKEN is required");
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  private get canRefresh(): boolean {
    return !!(this.refreshToken && this.clientId && this.clientSecret);
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) {
      throw new DriveError(
        401,
        "Access token expired and no refresh token configured. Set GOOGLE_REFRESH_TOKEN, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET.",
      );
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
    const data = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
    if (!response.ok || !data.access_token) {
      throw new DriveError(401, `Token refresh failed: ${data.error_description ?? data.error ?? "unknown error"}`);
    }
    this.accessToken = data.access_token;
  }

  /** Standard JSON API call (metadata operations). */
  async callApi<T = unknown>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    body?: Record<string, unknown>,
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const result = await this.executeRequest<T>(API_BASE, method, path, body, query);
    if (result.status === 401 && this.canRefresh) {
      await this.refreshAccessToken();
      const retry = await this.executeRequest<T>(API_BASE, method, path, body, query);
      return this.handleResponse<T>(retry);
    }
    return this.handleResponse<T>(result);
  }

  /** Download file content (alt=media) — returns raw text or base64 for binary. */
  async downloadFile(fileId: string): Promise<{ content: string; mimeType: string }> {
    const url = `${API_BASE}/files/${encodeURIComponent(fileId)}?alt=media`;
    const result = await this.rawRequest(url, "GET");
    if (result.status === 401 && this.canRefresh) {
      await this.refreshAccessToken();
      const retry = await this.rawRequest(url, "GET");
      if (!retry.response.ok) throw new DriveError(retry.status, `Download failed: ${retry.status}`);
      return this.extractContent(retry.response);
    }
    if (!result.response.ok) {
      throw new DriveError(result.status, `Download failed: ${result.status}`);
    }
    return this.extractContent(result.response);
  }

  /** Export Google Workspace file to a given MIME type. */
  async exportFile(fileId: string, mimeType: string): Promise<string> {
    const url = `${API_BASE}/files/${encodeURIComponent(fileId)}/export?mimeType=${encodeURIComponent(mimeType)}`;
    const result = await this.rawRequest(url, "GET");
    if (result.status === 401 && this.canRefresh) {
      await this.refreshAccessToken();
      const retry = await this.rawRequest(url, "GET");
      if (!retry.response.ok) throw new DriveError(retry.status, `Export failed: ${retry.status}`);
      return await retry.response.text();
    }
    if (!result.response.ok) throw new DriveError(result.status, `Export failed: ${result.status}`);
    return await result.response.text();
  }

  /** Multipart upload (metadata + content, up to 5MB). */
  async uploadFile(
    metadata: Record<string, unknown>,
    content: string,
    contentType: string,
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<unknown> {
    const boundary = `boundary_${crypto.randomUUID()}`;
    const isBinary =
      !contentType.startsWith("text/") &&
      !contentType.includes("json") &&
      !contentType.includes("xml") &&
      !contentType.includes("csv");
    const contentPart = isBinary
      ? Buffer.concat([
          Buffer.from(`--${boundary}\r\nContent-Type: ${contentType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`),
          Buffer.from(content, "base64"),
          Buffer.from("\r\n"),
        ])
      : Buffer.from(`--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n${content}\r\n`);
    const metadataPart = Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    );
    const endPart = Buffer.from(`--${boundary}--`);
    const body = Buffer.concat([metadataPart, contentPart, endPart]);
    let url = `${UPLOAD_BASE}/files?uploadType=multipart`;
    if (query) {
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) p.append(k, String(v));
      }
      const qs = p.toString();
      if (qs) url += `&${qs}`;
    }
    const result = await this.rawRequest(url, "POST", body, `multipart/related; boundary=${boundary}`);
    if (result.status === 401 && this.canRefresh) {
      await this.refreshAccessToken();
      const retry = await this.rawRequest(url, "POST", body, `multipart/related; boundary=${boundary}`);
      return this.parseJsonResponse(retry);
    }
    return this.parseJsonResponse(result);
  }

  /** Multipart update (metadata + content). */
  async updateFileContent(
    fileId: string,
    metadata: Record<string, unknown>,
    content: string,
    contentType: string,
  ): Promise<unknown> {
    const boundary = `boundary_${crypto.randomUUID()}`;
    const isBinary =
      !contentType.startsWith("text/") &&
      !contentType.includes("json") &&
      !contentType.includes("xml") &&
      !contentType.includes("csv");
    const contentPart = isBinary
      ? Buffer.concat([
          Buffer.from(`--${boundary}\r\nContent-Type: ${contentType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`),
          Buffer.from(content, "base64"),
          Buffer.from("\r\n"),
        ])
      : Buffer.from(`--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n${content}\r\n`);
    const metadataPart = Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    );
    const endPart = Buffer.from(`--${boundary}--`);
    const body = Buffer.concat([metadataPart, contentPart, endPart]);
    const url = `${UPLOAD_BASE}/files/${encodeURIComponent(fileId)}?uploadType=multipart`;
    const result = await this.rawRequest(url, "PATCH", body, `multipart/related; boundary=${boundary}`);
    if (result.status === 401 && this.canRefresh) {
      await this.refreshAccessToken();
      const retry = await this.rawRequest(url, "PATCH", body, `multipart/related; boundary=${boundary}`);
      return this.parseJsonResponse(retry);
    }
    return this.parseJsonResponse(result);
  }

  private async parseJsonResponse(result: { response: Response; status: number }): Promise<unknown> {
    let data: unknown;
    try {
      data = await result.response.json();
    } catch {
      throw new DriveError(result.status, `Non-JSON response (${result.status})`);
    }
    if (!result.response.ok) throw new DriveError(result.status, JSON.stringify(data));
    return data;
  }

  private async rawRequest(
    url: string,
    method: string,
    body?: string | Buffer,
    contentType?: string,
  ): Promise<{ response: Response; status: number }> {
    const headers: Record<string, string> = { Authorization: `Bearer ${this.accessToken}` };
    if (contentType) headers["Content-Type"] = contentType;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body as BodyInit | undefined,
        signal: controller.signal,
      });
      return { response, status: response.status };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async extractContent(response: Response): Promise<{ content: string; mimeType: string }> {
    const ct = response.headers.get("content-type") ?? "application/octet-stream";
    if (ct.includes("text/") || ct.includes("json") || ct.includes("xml") || ct.includes("csv")) {
      return { content: await response.text(), mimeType: ct };
    }
    const buf = await response.arrayBuffer();
    return { content: Buffer.from(buf).toString("base64"), mimeType: ct };
  }

  private async executeRequest<_T>(
    base: string,
    method: string,
    path: string,
    body?: Record<string, unknown>,
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<{ response: Response; data: unknown; status: number }> {
    let url = `${base}${path}`;
    if (query) {
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) p.append(k, String(v));
      }
      const qs = p.toString();
      if (qs) url += `?${qs}`;
    }
    const headers: Record<string, string> = { Authorization: `Bearer ${this.accessToken}` };
    let fetchBody: BodyInit | undefined;
    if (body && method !== "GET") {
      headers["Content-Type"] = "application/json";
      fetchBody = JSON.stringify(body);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, { method, headers, body: fetchBody, signal: controller.signal });
      if (response.status === 204) return { response, data: undefined, status: 204 };
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        data = { error: { code: response.status, message: `Non-JSON response (${response.status})` } };
      }
      return { response, data, status: response.status };
    } finally {
      clearTimeout(timeout);
    }
  }

  private handleResponse<T>(result: { response: Response; data: unknown; status: number }): T {
    if (result.status === 204) return undefined as T;
    if (!result.response.ok) {
      const err = (result.data as { error?: { code?: number; message?: string } }).error;
      throw new DriveError(err?.code ?? result.status, err?.message ?? "Unknown error");
    }
    return result.data as T;
  }
}

export class DriveError extends Error {
  constructor(
    public readonly code: number,
    public readonly description: string,
  ) {
    super(`Drive error ${code}: ${description}`);
    this.name = "DriveError";
  }
}
