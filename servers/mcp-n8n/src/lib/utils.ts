import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { N8nError } from "./client.js";

export { toolResult, toolError };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof N8nError) {
    return `n8n error ${error.status}: ${error.description}`;
  }
});
