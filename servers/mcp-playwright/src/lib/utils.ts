import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { PlaywrightError } from "./browser.js";

export { toolError, toolResult };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof PlaywrightError) {
    return `Playwright ${error.action}: ${error.message}${error.selector ? ` (selector: ${error.selector})` : ""}`;
  }
});
