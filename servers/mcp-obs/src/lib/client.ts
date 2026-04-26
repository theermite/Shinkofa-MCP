/**
 * OBS WebSocket v5 client wrapper.
 *
 * Wraps obs-websocket-js with auto-reconnect and typed error handling.
 *
 * Environment variables:
 *   OBS_WEBSOCKET_URL      — WebSocket URL (default: "ws://127.0.0.1:4455")
 *   OBS_WEBSOCKET_PASSWORD — Authentication password (optional)
 */
import OBSWebSocket from "obs-websocket-js";

export class OBSError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OBSError";
  }
}

export interface OBSConfig {
  url: string;
  password: string | undefined;
}

export function createConfig(env: Record<string, string | undefined>): OBSConfig {
  return {
    url: env.OBS_WEBSOCKET_URL ?? "ws://127.0.0.1:4455",
    password: env.OBS_WEBSOCKET_PASSWORD,
  };
}

export class OBSClient {
  private readonly obs = new OBSWebSocket();
  private connected = false;
  private readonly config: OBSConfig;

  constructor(config: OBSConfig) {
    this.config = config;
    this.obs.on("ConnectionClosed", () => {
      this.connected = false;
    });
    this.obs.on("ConnectionError", () => {
      this.connected = false;
    });
  }

  async ensureConnected(): Promise<void> {
    if (this.connected) return;
    try {
      await this.obs.connect(this.config.url, this.config.password);
      this.connected = true;
    } catch (err) {
      this.connected = false;
      const msg = err instanceof Error ? err.message : String(err);
      throw new OBSError(`Cannot connect to OBS at ${this.config.url}: ${msg}`);
    }
  }

  async call(requestType: string, requestData?: Record<string, unknown>): Promise<unknown> {
    await this.ensureConnected();
    try {
      return await this.obs.call(requestType as never, requestData as never);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new OBSError(`OBS request "${requestType}" failed: ${msg}`);
    }
  }

  disconnect(): void {
    this.obs.disconnect();
    this.connected = false;
  }
}
