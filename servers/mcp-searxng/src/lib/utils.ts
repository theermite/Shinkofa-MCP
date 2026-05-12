import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { SearxngError } from "./client.js";

export { toolError, toolResult };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof SearxngError) {
    return `SearXNG error ${error.status}: ${error.detail}`;
  }
});
