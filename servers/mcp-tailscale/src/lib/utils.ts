import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { TailscaleError } from "./client.js";

export { toolResult, toolError };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof TailscaleError) {
    return `Tailscale error ${error.status}: ${error.detail}${error.isRateLimited ? " (rate limited)" : error.isUnauthorized ? " (check TAILSCALE_API_KEY and tailnet)" : ""}`;
  }
});
