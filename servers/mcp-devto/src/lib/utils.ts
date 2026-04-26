import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { DevtoError } from "./client.js";

export { toolResult, toolError };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof DevtoError) {
    return `DEV.to error ${error.status}: ${error.detail}${error.isRateLimited ? " (rate limited — retry later)" : ""}`;
  }
});
