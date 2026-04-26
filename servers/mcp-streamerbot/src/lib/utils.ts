import { createErrorHandler, toolResult as jsonToolResult, toolError } from "@shinkofa/mcp-shared";
import { StreamerbotError } from "./client.js";

export { toolError };

export function toolResult(data: unknown) {
  if (typeof data === "string") {
    return { content: [{ type: "text" as const, text: data }] };
  }
  return jsonToolResult(data);
}

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof StreamerbotError) {
    return `Streamer.bot error: ${error.message}`;
  }
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
});
