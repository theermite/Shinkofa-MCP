/**
 * Stripe API client — thin typed wrapper over fetch.
 * Uses form-encoded bodies (Stripe convention) with Bearer auth.
 */

export interface StripeClientConfig {
  secretKey: string;
  apiBaseUrl?: string;
  apiVersion?: string;
  timeoutMs?: number;
}

export class StripeClient {
  private readonly secretKey: string;
  private readonly apiBaseUrl: string;
  private readonly apiVersion: string;
  private readonly timeoutMs: number;

  constructor(config: StripeClientConfig) {
    if (!config.secretKey) {
      throw new Error("STRIPE_SECRET_KEY is required");
    }
    this.secretKey = config.secretKey;
    this.apiBaseUrl = config.apiBaseUrl ?? "https://api.stripe.com/v1";
    this.apiVersion = config.apiVersion ?? "2025-02-24.acacia";
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  /**
   * Flatten nested objects into Stripe's form-encoded format.
   * e.g., { metadata: { key: "val" } } → "metadata[key]=val"
   */
  flattenParams(obj: Record<string, unknown>, prefix = ""): [string, string][] {
    const pairs: [string, string][] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;

      const fullKey = prefix ? `${prefix}[${key}]` : key;

      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] === "object" && value[i] !== null) {
            pairs.push(...this.flattenParams(value[i] as Record<string, unknown>, `${fullKey}[${i}]`));
          } else {
            pairs.push([`${fullKey}[${i}]`, String(value[i])]);
          }
        }
      } else if (typeof value === "object") {
        pairs.push(...this.flattenParams(value as Record<string, unknown>, fullKey));
      } else {
        pairs.push([fullKey, String(value)]);
      }
    }

    return pairs;
  }

  /**
   * Execute a request and return raw response + parsed data.
   * Guards against non-JSON responses (502/503 proxy errors).
   */
  private async executeRequest(
    method: "GET" | "POST" | "DELETE",
    path: string,
    params?: Record<string, unknown>,
  ): Promise<{ response: Response; data: unknown; status: number }> {
    let url = `${this.apiBaseUrl}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.secretKey}`,
      "Stripe-Version": this.apiVersion,
    };

    let body: BodyInit | undefined;

    if (params) {
      const cleaned = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null));

      if (method === "GET") {
        const searchParams = new URLSearchParams();
        for (const [k, v] of this.flattenParams(cleaned)) {
          searchParams.append(k, v);
        }
        const qs = searchParams.toString();
        if (qs) url += `?${qs}`;
      } else {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        const formParams = new URLSearchParams();
        for (const [k, v] of this.flattenParams(cleaned)) {
          formParams.append(k, v);
        }
        body = formParams.toString();
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      if (response.status === 204) {
        return { response, data: undefined, status: 204 };
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        data = {
          error: {
            type: "api_error",
            message: `Non-JSON response (${response.status})`,
          },
        };
      }

      return { response, data, status: response.status };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Process the response — throw StripeError on non-2xx.
   */
  private handleResponse<T>(response: Response, data: unknown): T {
    if (response.status === 204) return undefined as T;

    if (!response.ok) {
      const err = (
        data as {
          error?: { type?: string; code?: string; message?: string };
        }
      ).error;
      throw new StripeError(response.status, err?.type ?? "api_error", err?.code, err?.message ?? response.statusText);
    }

    return data as T;
  }

  /**
   * Call any Stripe API endpoint.
   * @param method HTTP method
   * @param path API path (e.g. "/customers")
   * @param params Parameters (form-encoded for POST/PATCH, query for GET)
   */
  async callApi<T = unknown>(
    method: "GET" | "POST" | "DELETE",
    path: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const { response, data } = await this.executeRequest(method, path, params);
    return this.handleResponse<T>(response, data);
  }
}

export class StripeError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly type: string,
    public readonly code: string | undefined,
    public readonly description: string,
  ) {
    super(`Stripe error ${httpStatus} (${type}${code ? `/${code}` : ""}): ${description}`);
    this.name = "StripeError";
  }
}
