import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { OllamaError } from "./client.js";

export { toolError, toolResult };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof OllamaError) {
    return `Ollama error ${error.status}: ${error.detail}`;
  }
});
