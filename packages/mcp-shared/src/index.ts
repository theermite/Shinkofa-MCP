export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export type ErrorFormatter = (error: unknown) => string | undefined;

export function toolResult(data: unknown): ToolResponse {
  const text = data === undefined ? '{"status":"success"}' : JSON.stringify(data, null, 2);
  return { content: [{ type: "text" as const, text }] };
}

export function toolError(message: string): ToolResponse {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function createErrorHandler(formatApiError?: ErrorFormatter) {
  return async function withErrorHandler<T>(fn: () => Promise<T>): Promise<T | ToolResponse> {
    try {
      return await fn();
    } catch (error) {
      if (formatApiError) {
        const message = formatApiError(error);
        if (message) return toolError(message);
      }
      if (error instanceof Error) {
        if (error.name === "AbortError") return toolError("Request timed out");
        if (error.name === "SyntaxError") return toolError("Invalid API response (non-JSON)");
        if (error.name === "TypeError") return toolError(`Network error: ${error.message}`);
      }
      throw error;
    }
  };
}
