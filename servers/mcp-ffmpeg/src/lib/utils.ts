import { createErrorHandler, toolResult as jsonToolResult, toolError } from "@shinkofa/mcp-shared";

export { toolError };

export function toolResult(data: unknown) {
  if (typeof data === "string") {
    return { content: [{ type: "text" as const, text: data }] };
  }
  return jsonToolResult(data);
}

export const withErrorHandler = createErrorHandler((error) => {
  if (
    error instanceof Error &&
    error.name !== "AbortError" &&
    error.name !== "SyntaxError" &&
    error.name !== "TypeError"
  ) {
    return `FFmpeg error: ${error.message}`;
  }
});
