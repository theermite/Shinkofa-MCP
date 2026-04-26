import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { HAError } from "./client.js";

export { toolResult, toolError };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof HAError) {
    return `HA error ${error.status}: ${error.description}`;
  }
});
