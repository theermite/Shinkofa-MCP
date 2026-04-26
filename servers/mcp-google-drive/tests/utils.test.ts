import { describe, expect, it } from "vitest";
import { DriveError } from "../src/lib/client.js";
import {
  GOOGLE_WORKSPACE_TYPES,
  isGoogleWorkspaceType,
  toolError,
  toolResult,
  withErrorHandler,
} from "../src/lib/utils.js";

// ---------------------------------------------------------------------------
// toolResult
// ---------------------------------------------------------------------------

describe("toolResult", () => {
  it("should_json_stringify_data_with_indentation", () => {
    const result = toolResult({ id: "abc", name: "test" });
    expect(result.content[0].text).toBe(JSON.stringify({ id: "abc", name: "test" }, null, 2));
  });

  it("should_return_success_status_when_data_is_undefined", () => {
    const result = toolResult(undefined);
    expect(result.content[0].text).toBe('{"status":"success"}');
  });

  it("should_return_content_array_with_text_type", () => {
    const result = toolResult("hello");
    expect(result.content[0].type).toBe("text");
  });

  it("should_handle_null_data_as_json_null", () => {
    const result = toolResult(null);
    expect(result.content[0].text).toBe("null");
  });
});

// ---------------------------------------------------------------------------
// toolError
// ---------------------------------------------------------------------------

describe("toolError", () => {
  it("should_set_isError_true", () => {
    const result = toolError("Something went wrong");
    expect(result.isError).toBe(true);
  });

  it("should_include_message_in_content_text", () => {
    const result = toolError("Drive error 404: Not found");
    expect(result.content[0].text).toBe("Drive error 404: Not found");
  });

  it("should_return_content_array_with_text_type", () => {
    const result = toolError("err");
    expect(result.content[0].type).toBe("text");
  });
});

// ---------------------------------------------------------------------------
// withErrorHandler
// ---------------------------------------------------------------------------

describe("withErrorHandler", () => {
  it("should_return_function_result_on_success", async () => {
    const result = await withErrorHandler(async () => toolResult({ ok: true }));
    expect("content" in result).toBe(true);
  });

  it("should_catch_DriveError_and_return_toolError", async () => {
    const result = await withErrorHandler(async () => {
      throw new DriveError(403, "Forbidden");
    });
    expect("isError" in result && result.isError).toBe(true);
    expect((result as ReturnType<typeof toolError>).content[0].text).toContain("403");
    expect((result as ReturnType<typeof toolError>).content[0].text).toContain("Forbidden");
  });

  it("should_catch_AbortError_and_return_timeout_message", async () => {
    const result = await withErrorHandler(async () => {
      const err = new Error("Aborted");
      err.name = "AbortError";
      throw err;
    });
    expect((result as ReturnType<typeof toolError>).content[0].text).toBe("Request timed out");
  });

  it("should_catch_SyntaxError_and_return_non_json_message", async () => {
    const result = await withErrorHandler(async () => {
      throw new SyntaxError("Unexpected token");
    });
    expect((result as ReturnType<typeof toolError>).content[0].text).toContain("non-JSON");
  });

  it("should_catch_TypeError_and_return_network_error_message", async () => {
    const result = await withErrorHandler(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect((result as ReturnType<typeof toolError>).content[0].text).toContain("Network error");
    expect((result as ReturnType<typeof toolError>).content[0].text).toContain("Failed to fetch");
  });

  it("should_rethrow_unknown_errors", async () => {
    class WeirdError extends Error {
      constructor() {
        super("weird");
        this.name = "WeirdError";
      }
    }
    await expect(
      withErrorHandler(async () => {
        throw new WeirdError();
      }),
    ).rejects.toBeInstanceOf(WeirdError);
  });
});

// ---------------------------------------------------------------------------
// GOOGLE_WORKSPACE_TYPES
// ---------------------------------------------------------------------------

describe("GOOGLE_WORKSPACE_TYPES", () => {
  it("should_export_document_as_text_markdown", () => {
    expect(GOOGLE_WORKSPACE_TYPES["application/vnd.google-apps.document"]).toBe("text/markdown");
  });

  it("should_export_spreadsheet_as_text_csv", () => {
    expect(GOOGLE_WORKSPACE_TYPES["application/vnd.google-apps.spreadsheet"]).toBe("text/csv");
  });

  it("should_export_presentation_as_text_plain", () => {
    expect(GOOGLE_WORKSPACE_TYPES["application/vnd.google-apps.presentation"]).toBe("text/plain");
  });

  it("should_export_drawing_as_image_svg_xml", () => {
    expect(GOOGLE_WORKSPACE_TYPES["application/vnd.google-apps.drawing"]).toBe("image/svg+xml");
  });

  it("should_export_script_as_script_json", () => {
    expect(GOOGLE_WORKSPACE_TYPES["application/vnd.google-apps.script"]).toBe(
      "application/vnd.google-apps.script+json",
    );
  });
});

// ---------------------------------------------------------------------------
// isGoogleWorkspaceType
// ---------------------------------------------------------------------------

describe("isGoogleWorkspaceType", () => {
  it("should_return_true_for_google_apps_document", () => {
    expect(isGoogleWorkspaceType("application/vnd.google-apps.document")).toBe(true);
  });

  it("should_return_true_for_google_apps_spreadsheet", () => {
    expect(isGoogleWorkspaceType("application/vnd.google-apps.spreadsheet")).toBe(true);
  });

  it("should_return_true_for_google_apps_presentation", () => {
    expect(isGoogleWorkspaceType("application/vnd.google-apps.presentation")).toBe(true);
  });

  it("should_return_true_for_google_apps_drawing", () => {
    expect(isGoogleWorkspaceType("application/vnd.google-apps.drawing")).toBe(true);
  });

  it("should_return_true_for_google_apps_script", () => {
    expect(isGoogleWorkspaceType("application/vnd.google-apps.script")).toBe(true);
  });

  it("should_return_false_for_google_apps_folder", () => {
    expect(isGoogleWorkspaceType("application/vnd.google-apps.folder")).toBe(false);
  });

  it("should_return_false_for_google_apps_shortcut", () => {
    expect(isGoogleWorkspaceType("application/vnd.google-apps.shortcut")).toBe(false);
  });

  it("should_return_false_for_google_apps_form", () => {
    expect(isGoogleWorkspaceType("application/vnd.google-apps.form")).toBe(false);
  });

  it("should_return_false_for_google_apps_map", () => {
    expect(isGoogleWorkspaceType("application/vnd.google-apps.map")).toBe(false);
  });

  it("should_return_false_for_google_apps_site", () => {
    expect(isGoogleWorkspaceType("application/vnd.google-apps.site")).toBe(false);
  });

  it("should_return_false_for_application_pdf", () => {
    expect(isGoogleWorkspaceType("application/pdf")).toBe(false);
  });

  it("should_return_false_for_plain_text", () => {
    expect(isGoogleWorkspaceType("text/plain")).toBe(false);
  });
});
