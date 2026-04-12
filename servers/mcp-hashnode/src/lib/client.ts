/**
 * Hashnode GraphQL API client — thin typed wrapper over fetch.
 * All requests go to a single GraphQL endpoint.
 */

export interface HashnodeClientConfig {
  pat: string;
  endpoint?: string;
  timeoutMs?: number;
}

export class HashnodeClient {
  private readonly endpoint: string;
  private readonly pat: string;
  private readonly timeoutMs: number;

  constructor(config: HashnodeClientConfig) {
    if (!config.pat) {
      throw new Error("HASHNODE_PAT is required");
    }
    this.pat = config.pat;
    this.endpoint = config.endpoint ?? "https://gql.hashnode.com";
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  async query<T = unknown>(
    gql: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.pat,
        },
        body: JSON.stringify({ query: gql, variables }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let message: string;
        try {
          const data = (await res.json()) as { message?: string };
          message = data.message ?? `HTTP ${res.status}`;
        } catch {
          message = `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new HashnodeError(res.status, message);
      }

      const body = (await res.json()) as {
        data?: T;
        errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
      };

      if (body.errors && body.errors.length > 0) {
        const first = body.errors[0]!;
        throw new HashnodeError(400, first.message);
      }

      return body.data as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class HashnodeError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(`Hashnode error ${status}: ${detail}`);
    this.name = "HashnodeError";
  }
}
