/**
 * Streamer.bot WebSocket client.
 *
 * Connects to Streamer.bot's WebSocket server and sends
 * JSON-RPC-style requests with id correlation.
 *
 * Environment variables:
 *   STREAMERBOT_HOST — WebSocket host (default: "127.0.0.1")
 *   STREAMERBOT_PORT — WebSocket port (default: "8080")
 */
import WebSocket from "ws";

export class StreamerbotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StreamerbotError";
  }
}

export interface StreamerbotConfig {
  host: string;
  port: string;
  connectTimeoutMs: number;
  requestTimeoutMs: number;
}

export function createConfig(env: Record<string, string | undefined>): StreamerbotConfig {
  return {
    host: env["STREAMERBOT_HOST"] ?? "127.0.0.1",
    port: env["STREAMERBOT_PORT"] ?? "8080",
    connectTimeoutMs: Number(env["STREAMERBOT_CONNECT_TIMEOUT_MS"]) || 5000,
    requestTimeoutMs: Number(env["STREAMERBOT_REQUEST_TIMEOUT_MS"]) || 10000,
  };
}

export function getWsUrl(config: StreamerbotConfig): string {
  return `ws://${config.host}:${config.port}/`;
}

type PendingResolve = (msg: Record<string, unknown>) => void;
type PendingReject = (err: Error) => void;

interface PendingRequest {
  resolve: PendingResolve;
  reject: PendingReject;
  timer: ReturnType<typeof setTimeout>;
}

export class StreamerbotClient {
  private ws: WebSocket | null = null;
  private requestId = 0;
  private readonly pending = new Map<string, PendingRequest>();
  private readonly config: StreamerbotConfig;

  constructor(config: StreamerbotConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const url = getWsUrl(this.config);

    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url);

      const timeout = setTimeout(() => {
        socket.terminate();
        reject(new StreamerbotError(`Connection timeout (${this.config.connectTimeoutMs}ms)`));
      }, this.config.connectTimeoutMs);

      socket.on("open", () => {
        clearTimeout(timeout);
        this.ws = socket;
        resolve();
      });

      socket.on("message", (data) => {
        this.handleMessage(data);
      });

      socket.on("error", (err) => {
        clearTimeout(timeout);
        reject(new StreamerbotError(`WebSocket error: ${err.message}`));
      });

      socket.on("close", () => {
        this.ws = null;
        for (const [id, req] of this.pending) {
          req.reject(new StreamerbotError("Connection closed"));
          clearTimeout(req.timer);
          this.pending.delete(id);
        }
      });
    });
  }

  async sendRequest(
    request: string,
    args: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    await this.connect();

    const id = `mcp-${++this.requestId}`;
    const payload = { request, id, ...args };

    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new StreamerbotError(`Request "${request}" timed out (${this.config.requestTimeoutMs}ms)`));
      }, this.config.requestTimeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      this.ws!.send(JSON.stringify(payload));
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handleMessage(data: WebSocket.RawData): void {
    try {
      const msg = JSON.parse(data.toString()) as Record<string, unknown>;
      const id = msg["id"] as string | undefined;
      if (id && this.pending.has(id)) {
        const req = this.pending.get(id)!;
        clearTimeout(req.timer);
        this.pending.delete(id);
        req.resolve(msg);
      }
    } catch {
      // Ignore malformed messages
    }
  }
}
