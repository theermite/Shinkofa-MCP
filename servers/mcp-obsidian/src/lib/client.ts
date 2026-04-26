/**
 * Obsidian Local REST API client.
 * Requires the "Local REST API" community plugin enabled in Obsidian.
 * Default: https://127.0.0.1:27124
 */

import { Agent, type Dispatcher, fetch as undiciFetch } from "undici";

export interface ObsidianClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  insecure?: boolean;
}

export class ObsidianClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly dispatcher: Dispatcher | undefined;

  constructor(config: ObsidianClientConfig) {
    if (!config.apiKey) throw new Error("OBSIDIAN_API_KEY is required");
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://127.0.0.1:27124";
    this.timeoutMs = config.timeoutMs ?? 15_000;
    // Scoped TLS bypass — only affects this client's connections, not process-wide
    this.dispatcher = config.insecure ? new Agent({ connect: { rejectUnauthorized: false } }) : undefined;
  }

  async callApi<T = unknown>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
    accept?: string,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    if (accept) headers["Accept"] = accept;

    let fetchBody: string | undefined;
    if (body !== undefined && method !== "GET") {
      if (typeof body === "string") {
        headers["Content-Type"] = "text/markdown";
        fetchBody = body;
      } else {
        headers["Content-Type"] = "application/json";
        fetchBody = JSON.stringify(body);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await undiciFetch(url, {
        method, headers, body: fetchBody, signal: controller.signal,
        dispatcher: this.dispatcher,
      });

      if (response.status === 204) return undefined as T;

      const contentType = response.headers.get("content-type") ?? "";
      let data: unknown;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new ObsidianError(response.status, typeof data === "string" ? data : JSON.stringify(data));
      }
      return data as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class ObsidianError extends Error {
  constructor(public readonly status: number, public readonly description: string) {
    super(`Obsidian API error ${status}: ${description}`);
    this.name = "ObsidianError";
  }
}
