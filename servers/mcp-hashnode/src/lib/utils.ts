import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { HashnodeError } from "./client.js";

export { toolError, toolResult };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof HashnodeError) {
    return `Hashnode error ${error.status}: ${error.detail}`;
  }
});
