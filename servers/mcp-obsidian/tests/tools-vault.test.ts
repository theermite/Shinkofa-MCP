import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianClient, ObsidianError } from "../src/lib/client.js";
import { registerVaultTools } from "../src/tools/vault.js";

let server: McpServer;
let client: ObsidianClient;
let callApiSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: any[]) => any>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new ObsidianClient({ apiKey: "test_key" });
  callApiSpy = vi.spyOn(client, "callApi").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as any);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerVaultTools(server, client);
});

describe("Vault tools — notes CRUD", () => {
  it("should_get_note", async () => {
    const cb = registeredTools.get("get_note")!;
    await cb({ path: "folder/note.md" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/vault/folder%2Fnote.md",
      undefined,
      "application/vnd.olrapi.note+json",
    );
  });

  it("should_create_note", async () => {
    const cb = registeredTools.get("create_note")!;
    await cb({ path: "new-note.md", content: "# Hello" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "PUT",
      "/vault/new-note.md",
      "# Hello",
    );
  });

  it("should_update_note", async () => {
    const cb = registeredTools.get("update_note")!;
    await cb({ path: "note.md", content: "Updated" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "PUT",
      "/vault/note.md",
      "Updated",
    );
  });

  it("should_append_to_note", async () => {
    const cb = registeredTools.get("append_to_note")!;
    await cb({ path: "note.md", content: "Appended" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/vault/note.md",
      "Appended",
    );
  });

  it("should_prepend_to_note", async () => {
    const cb = registeredTools.get("prepend_to_note")!;
    await cb({ path: "note.md", content: "Prepended" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "PATCH",
      "/vault/note.md",
      "Prepended",
    );
  });

  it("should_delete_note", async () => {
    callApiSpy.mockResolvedValue(undefined);
    const cb = registeredTools.get("delete_note")!;
    const result = await cb({ path: "old.md" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "DELETE",
      "/vault/old.md",
    );
    expect(result.content[0].text).toBe('{"status":"success"}');
  });

  it("should_encode_special_chars_in_path", async () => {
    const cb = registeredTools.get("get_note")!;
    await cb({ path: "my folder/my note.md" });
    expect(callApiSpy.mock.calls[0][1]).toBe("/vault/my%20folder%2Fmy%20note.md");
  });
});

describe("Vault tools — list files", () => {
  it("should_list_root", async () => {
    const cb = registeredTools.get("list_files")!;
    await cb({});
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/vault/");
  });

  it("should_list_subdirectory", async () => {
    const cb = registeredTools.get("list_files")!;
    await cb({ path: "Projects" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/vault/Projects/");
  });
});

describe("Vault tools — search", () => {
  it("should_search_vault", async () => {
    const cb = registeredTools.get("search_vault")!;
    await cb({ query: "test search" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/search/simple/?query=test%20search",
    );
  });

  it("should_search_with_contextLength", async () => {
    const cb = registeredTools.get("search_vault")!;
    await cb({ query: "hello", contextLength: 100 });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/search/simple/?query=hello&contextLength=100",
    );
  });

  it("should_search_vault_jsonlogic", async () => {
    const query = { "==": [{ var: "path" }, "test.md"] };
    const cb = registeredTools.get("search_vault_jsonlogic")!;
    await cb({ query });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/search/",
      query,
    );
  });
});

describe("Vault tools — active file", () => {
  it("should_get_active_file", async () => {
    const cb = registeredTools.get("get_active_file")!;
    await cb({});
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/active/",
      undefined,
      "application/vnd.olrapi.note+json",
    );
  });

  it("should_update_active_file", async () => {
    const cb = registeredTools.get("update_active_file")!;
    await cb({ content: "New content" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "PUT",
      "/active/",
      "New content",
    );
  });

  it("should_append_to_active_file", async () => {
    const cb = registeredTools.get("append_to_active_file")!;
    await cb({ content: "More content" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/active/",
      "More content",
    );
  });
});

describe("Vault tools — commands", () => {
  it("should_list_commands", async () => {
    const cb = registeredTools.get("list_commands")!;
    await cb({});
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/commands/");
  });

  it("should_execute_command", async () => {
    const cb = registeredTools.get("execute_command")!;
    await cb({ commandId: "editor:toggle-bold" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/commands/editor%3Atoggle-bold/",
    );
  });
});

describe("Vault tools — open note", () => {
  it("should_open_note", async () => {
    const cb = registeredTools.get("open_note")!;
    await cb({ path: "note.md" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/open/note.md",
      undefined,
    );
  });

  it("should_open_note_in_new_leaf", async () => {
    const cb = registeredTools.get("open_note")!;
    await cb({ path: "note.md", newLeaf: true });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/open/note.md",
      { newLeaf: true },
    );
  });
});

describe("Vault tools — periodic notes", () => {
  it("should_get_daily_note", async () => {
    const cb = registeredTools.get("get_periodic_note")!;
    await cb({ period: "daily" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/periodic/daily/",
      undefined,
      "application/vnd.olrapi.note+json",
    );
  });

  it("should_get_weekly_note", async () => {
    const cb = registeredTools.get("get_periodic_note")!;
    await cb({ period: "weekly" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/periodic/weekly/",
      undefined,
      "application/vnd.olrapi.note+json",
    );
  });
});

describe("Vault tools — status", () => {
  it("should_get_status", async () => {
    const cb = registeredTools.get("get_status")!;
    await cb({});
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/");
  });
});

describe("Vault tools — raw API call", () => {
  it("should_call_raw_GET", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "GET", path: "/vault/" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/vault/",
      undefined,
      undefined,
    );
  });

  it("should_call_raw_POST_with_body", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "POST", path: "/search/", body: { key: "val" } });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/search/",
      { key: "val" },
      undefined,
    );
  });

  it("should_pass_accept_header", async () => {
    const cb = registeredTools.get("raw_api_call")!;
    await cb({ method: "GET", path: "/vault/note.md", accept: "text/markdown" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/vault/note.md",
      undefined,
      "text/markdown",
    );
  });
});

describe("Vault tools — error handling", () => {
  it("should_handle_ObsidianError_gracefully", async () => {
    callApiSpy.mockRejectedValue(new ObsidianError(404, "Not found"));
    const cb = registeredTools.get("get_note")!;
    const result = await cb({ path: "missing.md" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("404");
    expect(result.content[0].text).toContain("Not found");
  });

  it("should_handle_timeout_gracefully", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    callApiSpy.mockRejectedValue(err);
    const cb = registeredTools.get("list_files")!;
    const result = await cb({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Request timed out");
  });

  it("should_handle_network_error_gracefully", async () => {
    callApiSpy.mockRejectedValue(new TypeError("fetch failed"));
    const cb = registeredTools.get("get_status")!;
    const result = await cb({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network error");
  });

  it("should_handle_error_on_create_note", async () => {
    callApiSpy.mockRejectedValue(new ObsidianError(400, "Bad request"));
    const cb = registeredTools.get("create_note")!;
    const result = await cb({ path: "bad.md", content: "" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("400");
  });

  it("should_handle_error_on_search", async () => {
    callApiSpy.mockRejectedValue(new ObsidianError(500, "Internal error"));
    const cb = registeredTools.get("search_vault")!;
    const result = await cb({ query: "test" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("500");
  });

  it("should_handle_error_on_raw_api_call", async () => {
    callApiSpy.mockRejectedValue(new ObsidianError(403, "Forbidden"));
    const cb = registeredTools.get("raw_api_call")!;
    const result = await cb({ method: "GET", path: "/secret" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("403");
  });
});
