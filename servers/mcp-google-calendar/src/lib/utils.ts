import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { GoogleCalendarError } from "./client.js";

export { toolError, toolResult };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof GoogleCalendarError) {
    return `Google Calendar error ${error.code}: ${error.description}`;
  }
});
