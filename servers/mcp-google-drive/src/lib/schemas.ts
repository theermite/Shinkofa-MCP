import { z } from "zod";

const FileId = z.string().describe("Google Drive file or folder ID");

export const ListFilesSchema = z.object({
  q: z
    .string()
    .optional()
    .describe("Search query (e.g. \"name contains 'budget'\" or \"mimeType = 'application/vnd.google-apps.folder'\")"),
  pageSize: z.number().min(1).max(1000).optional().describe("Max results per page (default 100, max 1000)"),
  pageToken: z.string().optional().describe("Token for next page of results"),
  orderBy: z.string().optional().describe("Sort order (e.g. 'modifiedTime desc', 'name')"),
  fields: z.string().optional().describe("Fields to include (e.g. 'files(id,name,mimeType,modifiedTime,size)')"),
  spaces: z.string().optional().describe("Spaces to search: 'drive', 'appDataFolder' (default: 'drive')"),
  supportsAllDrives: z.boolean().optional().describe("Include items from shared/team drives"),
  includeItemsFromAllDrives: z.boolean().optional().describe("Include items from all drives the user has access to"),
});

export const GetFileSchema = z.object({
  fileId: FileId,
  fields: z.string().optional().describe("Fields to include (e.g. 'id,name,mimeType,size,webViewLink,parents')"),
});

export const ReadFileSchema = z.object({
  fileId: FileId,
  exportMimeType: z
    .string()
    .optional()
    .describe(
      "For Google Workspace docs: export MIME type (e.g. 'text/markdown', 'text/csv', 'application/pdf'). Auto-detected if omitted.",
    ),
});

export const CreateFileSchema = z.object({
  name: z.string().describe("File name"),
  mimeType: z
    .string()
    .optional()
    .describe(
      "MIME type. Use 'application/vnd.google-apps.folder' for folders, 'application/vnd.google-apps.document' for Google Docs, etc.",
    ),
  parents: z.array(z.string()).optional().describe("Parent folder IDs (default: root)"),
  content: z
    .string()
    .optional()
    .describe("File content (text). For binary, use base64. Omit for empty files or Google Workspace types."),
  contentType: z
    .string()
    .optional()
    .describe("MIME type of the content being uploaded (e.g. 'text/plain', 'text/csv')"),
  description: z.string().optional().describe("File description"),
});

export const CreateFolderSchema = z.object({
  name: z.string().describe("Folder name"),
  parents: z.array(z.string()).optional().describe("Parent folder IDs (default: root)"),
  description: z.string().optional().describe("Folder description"),
});

export const UpdateFileSchema = z.object({
  fileId: FileId,
  name: z.string().optional().describe("New file name"),
  description: z.string().optional().describe("File description"),
  mimeType: z.string().optional().describe("New MIME type for the file"),
  trashed: z.boolean().optional().describe("Set true to move to trash, false to restore"),
  content: z.string().optional().describe("New file content (replaces existing)"),
  contentType: z.string().optional().describe("MIME type of the new content"),
});

export const MoveFileSchema = z.object({
  fileId: FileId,
  addParents: z.string().describe("Destination folder ID"),
  removeParents: z.string().describe("Source folder ID"),
});

export const CopyFileSchema = z.object({
  fileId: FileId,
  name: z.string().optional().describe("Name for the copy"),
  parents: z.array(z.string()).optional().describe("Parent folder IDs for the copy"),
});

export const DeleteFileSchema = z.object({
  fileId: FileId,
  permanent: z.boolean().optional().describe("If true, permanently delete (no trash). Default: moves to trash."),
});

export const ExportFileSchema = z.object({
  fileId: FileId,
  mimeType: z
    .string()
    .describe(
      "Target MIME type (e.g. 'application/pdf', 'text/markdown', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')",
    ),
});

export const ShareFileSchema = z.object({
  fileId: FileId,
  role: z.enum(["owner", "organizer", "fileOrganizer", "writer", "commenter", "reader"]).describe("Permission role"),
  type: z.enum(["user", "group", "domain", "anyone"]).describe("Grantee type"),
  emailAddress: z.string().optional().describe("Email (required for user/group type)"),
  domain: z.string().optional().describe("Domain (required for domain type)"),
  sendNotificationEmail: z.boolean().optional().describe("Send sharing notification (default: true)"),
});

export const ListPermissionsSchema = z.object({
  fileId: FileId,
  fields: z.string().optional().describe("Fields to include"),
});

export const DeletePermissionSchema = z.object({
  fileId: FileId,
  permissionId: z.string().describe("Permission ID to remove"),
});

export const RawApiCallSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
  path: z.string().describe("API path (e.g. '/files' or '/files/{fileId}/revisions')"),
  body: z.record(z.unknown()).optional().describe("Request body (JSON)"),
  query: z
    .record(z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .describe("Query string parameters"),
});
