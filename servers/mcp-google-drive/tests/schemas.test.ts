import { describe, it, expect } from "vitest";
import {
  ListFilesSchema,
  GetFileSchema,
  ReadFileSchema,
  CreateFileSchema,
  CreateFolderSchema,
  UpdateFileSchema,
  MoveFileSchema,
  CopyFileSchema,
  DeleteFileSchema,
  ExportFileSchema,
  ShareFileSchema,
  ListPermissionsSchema,
  DeletePermissionSchema,
  RawApiCallSchema,
} from "../src/lib/schemas.js";

// ---------------------------------------------------------------------------
// ListFilesSchema
// ---------------------------------------------------------------------------

describe("ListFilesSchema", () => {
  it("should_accept_empty_object", () => {
    expect(() => ListFilesSchema.parse({})).not.toThrow();
  });

  it("should_accept_all_optional_fields", () => {
    const input = {
      q: "name contains 'budget'",
      pageSize: 100,
      pageToken: "pt1",
      orderBy: "modifiedTime desc",
      fields: "files(id,name)",
      spaces: "drive",
      supportsAllDrives: true,
      includeItemsFromAllDrives: false,
    };
    const result = ListFilesSchema.parse(input);
    expect(result.supportsAllDrives).toBe(true);
    expect(result.includeItemsFromAllDrives).toBe(false);
  });

  it("should_reject_pageSize_below_min", () => {
    expect(() => ListFilesSchema.parse({ pageSize: 0 })).toThrow();
  });

  it("should_reject_pageSize_above_max", () => {
    expect(() => ListFilesSchema.parse({ pageSize: 1001 })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// GetFileSchema
// ---------------------------------------------------------------------------

describe("GetFileSchema", () => {
  it("should_accept_fileId_only", () => {
    const result = GetFileSchema.parse({ fileId: "abc123" });
    expect(result.fileId).toBe("abc123");
  });

  it("should_accept_optional_fields", () => {
    const result = GetFileSchema.parse({ fileId: "x", fields: "id,name" });
    expect(result.fields).toBe("id,name");
  });

  it("should_reject_missing_fileId", () => {
    expect(() => GetFileSchema.parse({})).toThrow();
  });
});

// ---------------------------------------------------------------------------
// ReadFileSchema
// ---------------------------------------------------------------------------

describe("ReadFileSchema", () => {
  it("should_accept_fileId_only", () => {
    expect(() => ReadFileSchema.parse({ fileId: "f1" })).not.toThrow();
  });

  it("should_accept_exportMimeType", () => {
    const result = ReadFileSchema.parse({ fileId: "f1", exportMimeType: "text/markdown" });
    expect(result.exportMimeType).toBe("text/markdown");
  });

  it("should_reject_missing_fileId", () => {
    expect(() => ReadFileSchema.parse({})).toThrow();
  });
});

// ---------------------------------------------------------------------------
// CreateFileSchema
// ---------------------------------------------------------------------------

describe("CreateFileSchema", () => {
  it("should_accept_name_only", () => {
    const result = CreateFileSchema.parse({ name: "myfile.txt" });
    expect(result.name).toBe("myfile.txt");
  });

  it("should_accept_all_fields_including_content", () => {
    const result = CreateFileSchema.parse({
      name: "data.csv",
      mimeType: "text/csv",
      parents: ["folder-id"],
      content: "a,b,c",
      contentType: "text/csv",
      description: "My CSV file",
    });
    expect(result.content).toBe("a,b,c");
    expect(result.parents).toEqual(["folder-id"]);
  });

  it("should_reject_missing_name", () => {
    expect(() => CreateFileSchema.parse({})).toThrow();
  });
});

// ---------------------------------------------------------------------------
// CreateFolderSchema
// ---------------------------------------------------------------------------

describe("CreateFolderSchema", () => {
  it("should_accept_name_only", () => {
    const result = CreateFolderSchema.parse({ name: "Reports" });
    expect(result.name).toBe("Reports");
  });

  it("should_accept_parents_and_description", () => {
    const result = CreateFolderSchema.parse({ name: "Sub", parents: ["root-id"], description: "A subfolder" });
    expect(result.parents).toEqual(["root-id"]);
  });

  it("should_reject_missing_name", () => {
    expect(() => CreateFolderSchema.parse({})).toThrow();
  });
});

// ---------------------------------------------------------------------------
// UpdateFileSchema
// ---------------------------------------------------------------------------

describe("UpdateFileSchema", () => {
  it("should_accept_fileId_with_trashed_true", () => {
    const result = UpdateFileSchema.parse({ fileId: "f1", trashed: true });
    expect(result.trashed).toBe(true);
  });

  it("should_accept_all_fields", () => {
    const result = UpdateFileSchema.parse({
      fileId: "f2",
      name: "renamed.txt",
      description: "updated",
      mimeType: "text/plain",
      trashed: false,
      content: "new content",
      contentType: "text/plain",
    });
    expect(result.name).toBe("renamed.txt");
  });

  it("should_reject_missing_fileId", () => {
    expect(() => UpdateFileSchema.parse({ name: "x" })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// MoveFileSchema
// ---------------------------------------------------------------------------

describe("MoveFileSchema", () => {
  it("should_accept_all_required_fields", () => {
    const result = MoveFileSchema.parse({
      fileId: "f1",
      addParents: "folder-dest",
      removeParents: "folder-src",
    });
    expect(result.addParents).toBe("folder-dest");
    expect(result.removeParents).toBe("folder-src");
  });

  it("should_reject_missing_addParents", () => {
    expect(() => MoveFileSchema.parse({ fileId: "f1", removeParents: "src" })).toThrow();
  });

  it("should_reject_missing_removeParents", () => {
    expect(() => MoveFileSchema.parse({ fileId: "f1", addParents: "dst" })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// CopyFileSchema
// ---------------------------------------------------------------------------

describe("CopyFileSchema", () => {
  it("should_accept_fileId_only", () => {
    const result = CopyFileSchema.parse({ fileId: "f1" });
    expect(result.fileId).toBe("f1");
  });

  it("should_accept_name_and_parents", () => {
    const result = CopyFileSchema.parse({ fileId: "f1", name: "copy.txt", parents: ["p1"] });
    expect(result.name).toBe("copy.txt");
  });

  it("should_reject_missing_fileId", () => {
    expect(() => CopyFileSchema.parse({})).toThrow();
  });
});

// ---------------------------------------------------------------------------
// DeleteFileSchema
// ---------------------------------------------------------------------------

describe("DeleteFileSchema", () => {
  it("should_accept_fileId_only", () => {
    const result = DeleteFileSchema.parse({ fileId: "f1" });
    expect(result.permanent).toBeUndefined();
  });

  it("should_accept_permanent_true", () => {
    const result = DeleteFileSchema.parse({ fileId: "f1", permanent: true });
    expect(result.permanent).toBe(true);
  });

  it("should_reject_missing_fileId", () => {
    expect(() => DeleteFileSchema.parse({})).toThrow();
  });
});

// ---------------------------------------------------------------------------
// ExportFileSchema
// ---------------------------------------------------------------------------

describe("ExportFileSchema", () => {
  it("should_accept_fileId_and_mimeType", () => {
    const result = ExportFileSchema.parse({ fileId: "f1", mimeType: "application/pdf" });
    expect(result.mimeType).toBe("application/pdf");
  });

  it("should_reject_missing_mimeType", () => {
    expect(() => ExportFileSchema.parse({ fileId: "f1" })).toThrow();
  });

  it("should_reject_missing_fileId", () => {
    expect(() => ExportFileSchema.parse({ mimeType: "text/csv" })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// ShareFileSchema
// ---------------------------------------------------------------------------

describe("ShareFileSchema", () => {
  it("should_accept_writer_role_for_user_type", () => {
    const result = ShareFileSchema.parse({
      fileId: "f1",
      role: "writer",
      type: "user",
      emailAddress: "user@example.com",
    });
    expect(result.role).toBe("writer");
  });

  it("should_accept_reader_role_for_anyone_type", () => {
    const result = ShareFileSchema.parse({ fileId: "f1", role: "reader", type: "anyone" });
    expect(result.type).toBe("anyone");
  });

  it("should_accept_domain_type_with_domain_field", () => {
    const result = ShareFileSchema.parse({ fileId: "f1", role: "commenter", type: "domain", domain: "example.com" });
    expect(result.domain).toBe("example.com");
  });

  it("should_accept_all_valid_roles", () => {
    const roles = ["owner", "organizer", "fileOrganizer", "writer", "commenter", "reader"] as const;
    for (const role of roles) {
      expect(() => ShareFileSchema.parse({ fileId: "f1", role, type: "user" })).not.toThrow();
    }
  });

  it("should_accept_all_valid_types", () => {
    const types = ["user", "group", "domain", "anyone"] as const;
    for (const type of types) {
      expect(() => ShareFileSchema.parse({ fileId: "f1", role: "reader", type })).not.toThrow();
    }
  });

  it("should_reject_invalid_role", () => {
    expect(() => ShareFileSchema.parse({ fileId: "f1", role: "superadmin", type: "user" })).toThrow();
  });

  it("should_reject_missing_fileId", () => {
    expect(() => ShareFileSchema.parse({ role: "reader", type: "user" })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// ListPermissionsSchema
// ---------------------------------------------------------------------------

describe("ListPermissionsSchema", () => {
  it("should_accept_fileId_only", () => {
    const result = ListPermissionsSchema.parse({ fileId: "f1" });
    expect(result.fileId).toBe("f1");
  });

  it("should_accept_optional_fields", () => {
    const result = ListPermissionsSchema.parse({ fileId: "f1", fields: "permissions(id,role)" });
    expect(result.fields).toBe("permissions(id,role)");
  });

  it("should_reject_missing_fileId", () => {
    expect(() => ListPermissionsSchema.parse({})).toThrow();
  });
});

// ---------------------------------------------------------------------------
// DeletePermissionSchema
// ---------------------------------------------------------------------------

describe("DeletePermissionSchema", () => {
  it("should_accept_fileId_and_permissionId", () => {
    const result = DeletePermissionSchema.parse({ fileId: "f1", permissionId: "perm-123" });
    expect(result.permissionId).toBe("perm-123");
  });

  it("should_reject_missing_permissionId", () => {
    expect(() => DeletePermissionSchema.parse({ fileId: "f1" })).toThrow();
  });

  it("should_reject_missing_fileId", () => {
    expect(() => DeletePermissionSchema.parse({ permissionId: "p1" })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// RawApiCallSchema
// ---------------------------------------------------------------------------

describe("RawApiCallSchema", () => {
  it("should_accept_GET_with_path_only", () => {
    const result = RawApiCallSchema.parse({ method: "GET", path: "/files" });
    expect(result.method).toBe("GET");
  });

  it("should_accept_POST_with_body", () => {
    const result = RawApiCallSchema.parse({ method: "POST", path: "/files", body: { name: "f" } });
    expect(result.body).toEqual({ name: "f" });
  });

  it("should_accept_query_with_string_number_boolean_values", () => {
    const result = RawApiCallSchema.parse({
      method: "GET",
      path: "/files",
      query: { pageSize: 50, q: "name='x'", supportsAllDrives: true },
    });
    expect(result.query?.pageSize).toBe(50);
    expect(result.query?.q).toBe("name='x'");
    expect(result.query?.supportsAllDrives).toBe(true);
  });

  it("should_reject_invalid_method", () => {
    expect(() => RawApiCallSchema.parse({ method: "HEAD", path: "/files" })).toThrow();
  });

  it("should_reject_missing_path", () => {
    expect(() => RawApiCallSchema.parse({ method: "GET" })).toThrow();
  });

  it("should_reject_missing_method", () => {
    expect(() => RawApiCallSchema.parse({ path: "/files" })).toThrow();
  });
});
