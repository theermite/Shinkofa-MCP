import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { TwitchError, TwitchRateLimitError } from "./client.js";

export { toolResult, toolError };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof TwitchRateLimitError) {
    return `Twitch rate limit: retry after ${error.retryAfter}s`;
  }
  if (error instanceof TwitchError) {
    return `Twitch error ${error.status}: ${error.description}`;
  }
});
