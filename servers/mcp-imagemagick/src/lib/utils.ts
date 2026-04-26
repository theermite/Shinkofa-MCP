import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";

export { toolError, toolResult };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof Error) {
    return `ImageMagick error: ${error.message}`;
  }
});
