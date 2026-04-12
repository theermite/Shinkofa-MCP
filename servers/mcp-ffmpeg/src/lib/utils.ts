/**
 * Shared utilities for MCP tool responses.
 */

export function toolResult(data: unknown) {
  if (data === undefined) {
    return { content: [{ type: "text" as const, text: '{"status":"success"}' }] };
  }
  return {
    content: [{ type: "text" as const, text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }],
  };
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
    if (error instanceof Error) {
      return toolError(`FFmpeg error: ${error.message}`);
    }
    throw error;
  }
}
