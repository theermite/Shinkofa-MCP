import { GoogleCalendarError } from "./client.js";

export function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
export function toolError(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export async function withErrorHandler<T>(fn: () => Promise<T>): Promise<T | ReturnType<typeof toolError>> {
  try { return await fn(); }
  catch (error) {
    if (error instanceof GoogleCalendarError) return toolError(`Google Calendar error ${error.code}: ${error.description}`);
    throw error;
  }
}
