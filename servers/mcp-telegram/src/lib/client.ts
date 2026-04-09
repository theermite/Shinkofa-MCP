/**
 * Telegram Bot API client — thin typed wrapper over fetch.
 * Supports all Bot API methods via callApi().
 */

export interface TelegramClientConfig {
  botToken: string;
  apiBaseUrl?: string;
  timeoutMs?: number;
}

export interface TelegramApiError {
  ok: false;
  error_code: number;
  description: string;
  parameters?: {
    migrate_to_chat_id?: number;
    retry_after?: number;
  };
}

export interface TelegramApiSuccess<T = unknown> {
  ok: true;
  result: T;
}

export type TelegramApiResponse<T = unknown> =
  | TelegramApiSuccess<T>
  | TelegramApiError;

export class TelegramClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: TelegramClientConfig) {
    if (!config.botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN is required");
    }
    const base = config.apiBaseUrl ?? "https://api.telegram.org";
    this.baseUrl = `${base}/bot${config.botToken}`;
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  /**
   * Call any Telegram Bot API method.
   * Handles JSON body for most methods, multipart for file uploads.
   */
  async callApi<T = unknown>(
    method: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}/${method}`;

    const hasFileUpload = params
      ? Object.values(params).some(
          (v) => v instanceof Blob || v instanceof Buffer || v instanceof Uint8Array
        )
      : false;

    let body: BodyInit | undefined;
    let headers: Record<string, string> = {};

    if (hasFileUpload && params) {
      const formData = new FormData();
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (value instanceof Blob) {
          formData.append(key, value);
        } else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
      body = formData;
    } else if (params) {
      const cleaned = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
      );
      if (Object.keys(cleaned).length > 0) {
        body = JSON.stringify(cleaned);
        headers = { "Content-Type": "application/json" };
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      let data: TelegramApiResponse<T>;
      try {
        data = (await response.json()) as TelegramApiResponse<T>;
      } catch {
        throw new TelegramError(response.status, `Non-JSON response (${response.status})`);
      }

      if (!data.ok) {
        const err = data as TelegramApiError;
        throw new TelegramError(err.error_code, err.description, err.parameters);
      }

      return data.result;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class TelegramError extends Error {
  constructor(
    public readonly code: number,
    public readonly description: string,
    public readonly parameters?: TelegramApiError["parameters"]
  ) {
    super(`Telegram API error ${code}: ${description}`);
    this.name = "TelegramError";
  }

  get isRateLimited(): boolean {
    return this.code === 429;
  }

  get retryAfter(): number | undefined {
    return this.parameters?.retry_after;
  }
}
