import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DriveClient } from "../lib/client.js";
import { ListFilesSchema, GetFileSchema, ReadFileSchema, CreateFileSchema, CreateFolderSchema, UpdateFileSchema, MoveFileSchema, CopyFileSchema, DeleteFileSchema, ExportFileSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler, GOOGLE_WORKSPACE_TYPES, isGoogleWorkspaceType } from "../lib/utils.js";

export function registerFileTools(server: McpServer, client: DriveClient): void {
  server.tool("drive_list_files", "Search and list files in Google Drive. Use q parameter for filtering (e.g. \"name contains 'budget'\", \"mimeType = 'application/vnd.google-apps.folder'\", \"'folderId' in parents\").", ListFilesSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const query: Record<string, string | number | boolean | undefined> = {};
      if (p.q) query.q = p.q;
      if (p.pageSize) query.pageSize = p.pageSize;
      if (p.pageToken) query.pageToken = p.pageToken;
      if (p.orderBy) query.orderBy = p.orderBy;
      if (p.fields) query.fields = p.fields;
      else query.fields = "files(id,name,mimeType,modifiedTime,size,parents,webViewLink),nextPageToken";
      if (p.spaces) query.spaces = p.spaces;
      if (p.supportsAllDrives) query.supportsAllDrives = p.supportsAllDrives;
      if (p.includeItemsFromAllDrives) query.includeItemsFromAllDrives = p.includeItemsFromAllDrives;
      return toolResult(await client.callApi("GET", "/files", undefined, query));
    });
  });

  server.tool("drive_get_file", "Get file or folder metadata by ID", GetFileSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const query: Record<string, string | number | boolean | undefined> = {};
      if (p.fields) query.fields = p.fields;
      else query.fields = "id,name,mimeType,modifiedTime,createdTime,size,parents,webViewLink,description,shared,trashed";
      return toolResult(await client.callApi("GET", `/files/${encodeURIComponent(p.fileId)}`, undefined, query));
    });
  });

  server.tool("drive_read_file", "Read file content. Auto-detects Google Workspace docs (exports to markdown/csv) vs regular files (downloads). Override export format with exportMimeType.", ReadFileSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const meta = await client.callApi<{ mimeType: string; name: string }>("GET", `/files/${encodeURIComponent(p.fileId)}`, undefined, { fields: "mimeType,name" });

      if (isGoogleWorkspaceType(meta.mimeType)) {
        const exportType = p.exportMimeType ?? GOOGLE_WORKSPACE_TYPES[meta.mimeType] ?? "text/plain";
        const content = await client.exportFile(p.fileId, exportType);
        return toolResult({ name: meta.name, mimeType: meta.mimeType, exportedAs: exportType, content });
      }

      const result = await client.downloadFile(p.fileId);
      return toolResult({ name: meta.name, mimeType: result.mimeType, content: result.content });
    });
  });

  server.tool("drive_create_file", "Create a file in Google Drive. For folders, use drive_create_folder instead.", CreateFileSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const metadata: Record<string, unknown> = { name: p.name };
      if (p.mimeType) metadata.mimeType = p.mimeType;
      if (p.parents) metadata.parents = p.parents;
      if (p.description) metadata.description = p.description;

      if (p.content) {
        const ct = p.contentType ?? "text/plain";
        return toolResult(await client.uploadFile(metadata, p.content, ct));
      }
      return toolResult(await client.callApi("POST", "/files", metadata));
    });
  });

  server.tool("drive_create_folder", "Create a folder in Google Drive", CreateFolderSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const metadata: Record<string, unknown> = {
        name: p.name,
        mimeType: "application/vnd.google-apps.folder",
      };
      if (p.parents) metadata.parents = p.parents;
      if (p.description) metadata.description = p.description;
      return toolResult(await client.callApi("POST", "/files", metadata));
    });
  });

  server.tool("drive_update_file", "Update file metadata and/or content. Use trashed=true to move to trash.", UpdateFileSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const metadata: Record<string, unknown> = {};
      if (p.name !== undefined) metadata.name = p.name;
      if (p.description !== undefined) metadata.description = p.description;
      if (p.mimeType !== undefined) metadata.mimeType = p.mimeType;
      if (p.trashed !== undefined) metadata.trashed = p.trashed;

      if (p.content) {
        const ct = p.contentType ?? "text/plain";
        return toolResult(await client.updateFileContent(p.fileId, metadata, p.content, ct));
      }
      return toolResult(await client.callApi("PATCH", `/files/${encodeURIComponent(p.fileId)}`, metadata));
    });
  });

  server.tool("drive_move_file", "Move a file to a different folder", MoveFileSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      return toolResult(await client.callApi("PATCH", `/files/${encodeURIComponent(p.fileId)}`, undefined, {
        addParents: p.addParents,
        removeParents: p.removeParents,
      }));
    });
  });

  server.tool("drive_copy_file", "Create a copy of a file", CopyFileSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const body: Record<string, unknown> = {};
      if (p.name) body.name = p.name;
      if (p.parents) body.parents = p.parents;
      return toolResult(await client.callApi("POST", `/files/${encodeURIComponent(p.fileId)}/copy`, body));
    });
  });

  server.tool("drive_delete_file", "Delete a file. Default: moves to trash. Set permanent=true for permanent deletion.", DeleteFileSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      if (p.permanent) {
        return toolResult(await client.callApi("DELETE", `/files/${encodeURIComponent(p.fileId)}`));
      }
      return toolResult(await client.callApi("PATCH", `/files/${encodeURIComponent(p.fileId)}`, { trashed: true }));
    });
  });

  server.tool("drive_export_file", "Export a Google Workspace document to a specific format (Docs→PDF/DOCX/Markdown, Sheets→XLSX/CSV, Slides→PDF/PPTX)", ExportFileSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const content = await client.exportFile(p.fileId, p.mimeType);
      return toolResult({ fileId: p.fileId, exportedAs: p.mimeType, content });
    });
  });
}
