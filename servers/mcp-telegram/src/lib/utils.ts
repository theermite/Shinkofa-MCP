import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { TelegramError } from "./client.js";

export { toolError, toolResult };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof TelegramError) {
    return `Telegram error ${error.code}: ${error.description}${error.retryAfter ? ` (retry after ${error.retryAfter}s)` : ""}`;
  }
});
