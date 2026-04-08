/**
 * Shared utilities for MCP tool responses.
 */

import { StripeError } from "./client.js";

export function toolResult(data: unknown) {
  const text =
    data === undefined
      ? '{"status":"success"}'
      : JSON.stringify(data, null, 2);
  return {
    content: [{ type: "text" as const, text }],
  };
}

export function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

/**
 * Wrap a tool callback to catch all expected errors gracefully.
 * Prevents process crashes on Stripe API errors, timeouts, and
 * non-JSON responses (502/503 proxy errors).
 */
export async function withErrorHandler<T>(
  fn: () => Promise<T>,
): Promise<T | ReturnType<typeof toolError>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof StripeError) {
      return toolError(
        `Stripe error ${error.httpStatus} (${error.type}${error.code ? `/${error.code}` : ""}): ${error.description}`,
      );
    }
    if (error instanceof Error) {
      if (error.name === "AbortError")
        return toolError("Request timed out");
      if (error.name === "SyntaxError")
        return toolError(
          "Invalid response from Stripe API (non-JSON)",
        );
      if (error.name === "TypeError")
        return toolError(`Network error: ${error.message}`);
    }
    throw error;
  }
}
