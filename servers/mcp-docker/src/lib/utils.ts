import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { DockerError } from "./client.js";

export { toolError, toolResult };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof DockerError) {
    return `Docker error ${error.status}: ${error.description}`;
  }
});
