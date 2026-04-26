import { createErrorHandler, toolError, toolResult } from "@shinkofa/mcp-shared";
import { DriveError } from "./client.js";

export { toolError, toolResult };

export const withErrorHandler = createErrorHandler((error) => {
  if (error instanceof DriveError) {
    return `Drive error ${error.code}: ${error.description}`;
  }
});

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
