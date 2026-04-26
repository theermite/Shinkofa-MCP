import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { ObsidianError } from "./client.js";

export { toolError, toolResult };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof ObsidianError) {
    return `Obsidian error ${error.status}: ${error.description}`;
  }
});
