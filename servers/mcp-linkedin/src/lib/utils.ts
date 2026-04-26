import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { LinkedInError } from "./client.js";

export { toolError, toolResult };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof LinkedInError) {
    return `LinkedIn error ${error.status}: ${error.detail}${error.isRateLimited ? " (rate limited — 150 req/day/member)" : ""}`;
  }
});
