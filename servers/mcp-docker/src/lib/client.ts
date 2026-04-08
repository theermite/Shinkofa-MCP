/**
 * Docker Engine API client. Unix socket or TCP.
 */
import { request } from "node:http";

export interface DockerClientConfig { socketPath?: string; host?: string; timeoutMs?: number; }

export class DockerClient {
  private readonly socketPath: string | undefined;
  private readonly host: string | undefined;
  private readonly timeoutMs: number;

  constructor(config: DockerClientConfig = {}) {
    this.socketPath = config.socketPath ?? (process.platform === "win32" ? "//./pipe/docker_engine" : "/var/run/docker.sock");
    this.host = config.host;
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  async callApi<T = unknown>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, body?: Record<string, unknown>, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    let fullPath = path;
    if (query) { const p = new URLSearchParams(); for (const [k, v] of Object.entries(query)) { if (v !== undefined) p.append(k, String(v)); } const qs = p.toString(); if (qs) fullPath += `?${qs}`; }

    return new Promise((resolve, reject) => {
      const options: Record<string, unknown> = { method, path: fullPath, timeout: this.timeoutMs };
      if (this.host) { const u = new URL(this.host); options.hostname = u.hostname; options.port = u.port; }
      else { options.socketPath = this.socketPath; }

      const headers: Record<string, string> = {};
      let bodyStr: string | undefined;
      if (body && method !== "GET") { headers["Content-Type"] = "application/json"; bodyStr = JSON.stringify(body); headers["Content-Length"] = String(Buffer.byteLength(bodyStr)); }
      options.headers = headers;

      const req = request(options as unknown as Parameters<typeof request>[0], (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
        res.on("end", () => {
          if (res.statusCode === 204) return resolve(undefined as T);
          try {
            const parsed = data ? JSON.parse(data) : undefined;
            if (res.statusCode && res.statusCode >= 400) reject(new DockerError(res.statusCode, (parsed as { message?: string })?.message ?? data));
            else resolve(parsed as T);
          } catch { resolve(data as T); }
        });
      });
      req.on("error", reject);
      req.on("timeout", () => { req.destroy(); reject(new Error("Docker API timeout")); });
      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  }
}

export class DockerError extends Error {
  constructor(public readonly status: number, public readonly description: string) { super(`Docker error ${status}: ${description}`); this.name = "DockerError"; }
}
