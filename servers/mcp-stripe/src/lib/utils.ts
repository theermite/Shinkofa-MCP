import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { StripeError } from "./client.js";

export { toolResult, toolError };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof StripeError) {
    return `Stripe error ${error.httpStatus} (${error.type}${error.code ? `/${error.code}` : ""}): ${error.description}`;
  }
});
