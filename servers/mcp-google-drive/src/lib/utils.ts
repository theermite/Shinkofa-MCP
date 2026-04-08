import { DriveError } from "./client.js";

export function toolResult(data: unknown) {
  const text = data === undefined ? '{"status":"success"}' : JSON.stringify(data, null, 2);
  return { content: [{ type: "text" as const, text }] };
}

export function toolError(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export async function withErrorHandler<T>(fn: () => Promise<T>): Promise<T | ReturnType<typeof toolError>> {
  try { return await fn(); }
  catch (error) {
    if (error instanceof DriveError) return toolError(`Drive error ${error.code}: ${error.description}`);
    if (error instanceof Error) {
      if (error.name === "AbortError") return toolError("Request timed out");
      if (error.name === "SyntaxError") return toolError("Invalid response from Drive API (non-JSON)");
      if (error.name === "TypeError") return toolError(`Network error: ${error.message}`);
    }
    throw error;
  }
}

/** Google Workspace MIME types that require export instead of download. */
export const GOOGLE_WORKSPACE_TYPES: Record<string, string> = {
  "application/vnd.google-apps.document": "text/markdown",
  "application/vnd.google-apps.spreadsheet": "text/csv",
  "application/vnd.google-apps.presentation": "text/plain",
  "application/vnd.google-apps.drawing": "image/svg+xml",
  "application/vnd.google-apps.script": "application/vnd.google-apps.script+json",
};

const NON_EXPORTABLE_TYPES = new Set([
  "application/vnd.google-apps.folder",
  "application/vnd.google-apps.shortcut",
  "application/vnd.google-apps.form",
  "application/vnd.google-apps.map",
  "application/vnd.google-apps.site",
]);

export function isGoogleWorkspaceType(mimeType: string): boolean {
  return mimeType.startsWith("application/vnd.google-apps.") && !NON_EXPORTABLE_TYPES.has(mimeType);
}
