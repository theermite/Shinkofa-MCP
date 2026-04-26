import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { DiscordError, DiscordRateLimitError } from "./client.js";

export { toolResult, toolError };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof DiscordRateLimitError) {
    return `Discord rate limit: retry after ${error.retryAfter}s${error.global ? " (global)" : ""}`;
  }
  if (error instanceof DiscordError) {
    return `Discord error ${error.httpStatus} (${error.code}): ${error.description}`;
  }
});
