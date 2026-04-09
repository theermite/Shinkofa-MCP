import { TwitchError, TwitchRateLimitError } from "./client.js";

export function toolResult(data: unknown) {
  const text = data === undefined ? '{"status":"success"}' : JSON.stringify(data, null, 2);
  return { content: [{ type: "text" as const, text }] };
}

export function toolError(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export async function withErrorHandler<T>(
  fn: () => Promise<T>,
): Promise<T | ReturnType<typeof toolError>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof TwitchRateLimitError) {
      return toolError(`Twitch rate limit: retry after ${error.retryAfter}s`);
    }
    if (error instanceof TwitchError) {
      return toolError(`Twitch error ${error.status}: ${error.description}`);
    }
    if (error instanceof Error) {
      if (error.name === "AbortError") return toolError("Request timed out");
      if (error.name === "SyntaxError") return toolError("Invalid response from Twitch API (non-JSON)");
      if (error.name === "TypeError") return toolError(`Network error: ${error.message}`);
    }
    throw error;
  }
}
