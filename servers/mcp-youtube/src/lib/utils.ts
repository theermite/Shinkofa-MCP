import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { YouTubeError } from "./client.js";

export { toolError, toolResult };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof YouTubeError) {
    return `YouTube error ${error.code}: ${error.description}`;
  }
});
