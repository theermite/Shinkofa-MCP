import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianClient } from "../lib/client.js";
import { GetNoteSchema, CreateNoteSchema, UpdateNoteSchema, AppendNoteSchema, PrependNoteSchema, DeleteNoteSchema, ListFilesSchema, SearchSchema, SearchJsonLogicSchema, GetActiveFileSchema, UpdateActiveFileSchema, AppendActiveFileSchema, OpenNoteSchema, GetPeriodicNoteSchema, GetStatusSchema, ListCommandsSchema, ExecuteCommandSchema, RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, toolError } from "../lib/utils.js";
import { ObsidianError } from "../lib/client.js";

export function registerVaultTools(server: McpServer, client: ObsidianClient): void {
  server.tool("get_note", "Get a note's content from the vault", GetNoteSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/vault/${encodeURIComponent(p.path)}`, undefined, "application/vnd.olrapi.note+json"));
  });

  server.tool("create_note", "Create a new note in the vault", CreateNoteSchema.shape, async (p) => {
    return toolResult(await client.callApi("PUT", `/vault/${encodeURIComponent(p.path)}`, p.content));
  });

  server.tool("update_note", "Replace a note's content entirely", UpdateNoteSchema.shape, async (p) => {
    return toolResult(await client.callApi("PUT", `/vault/${encodeURIComponent(p.path)}`, p.content));
  });

  server.tool("append_to_note", "Append content to an existing note", AppendNoteSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", `/vault/${encodeURIComponent(p.path)}`, p.content));
  });

  server.tool("prepend_to_note", "Prepend content to an existing note", PrependNoteSchema.shape, async (p) => {
    return toolResult(await client.callApi("PATCH", `/vault/${encodeURIComponent(p.path)}`, p.content));
  });

  server.tool("delete_note", "Delete a note from the vault", DeleteNoteSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/vault/${encodeURIComponent(p.path)}`));
  });

  server.tool("list_files", "List files and directories in the vault", ListFilesSchema.shape, async (p) => {
    const path = p.path ? `/vault/${encodeURIComponent(p.path)}/` : "/vault/";
    return toolResult(await client.callApi("GET", path));
  });

  server.tool("search_vault", "Search notes by text query", SearchSchema.shape, async (p) => {
    const query: Record<string, string | number | boolean | undefined> = {};
    if (p.contextLength) query.contextLength = p.contextLength;
    const url = `/search/simple/?query=${encodeURIComponent(p.query)}${p.contextLength ? `&contextLength=${p.contextLength}` : ""}`;
    return toolResult(await client.callApi("POST", url));
  });

  server.tool("search_vault_jsonlogic", "Search notes with JsonLogic query", SearchJsonLogicSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/search/", p.query));
  });

  // Active file
  server.tool("get_active_file", "Get the currently active/open file", GetActiveFileSchema.shape, async () => {
    return toolResult(await client.callApi("GET", "/active/", undefined, "application/vnd.olrapi.note+json"));
  });

  server.tool("update_active_file", "Replace content of the active file", UpdateActiveFileSchema.shape, async (p) => {
    return toolResult(await client.callApi("PUT", "/active/", p.content));
  });

  server.tool("append_to_active_file", "Append content to the active file", AppendActiveFileSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/active/", p.content));
  });

  // Commands
  server.tool("list_commands", "List all available Obsidian commands", ListCommandsSchema.shape, async () => {
    return toolResult(await client.callApi("GET", "/commands/"));
  });

  server.tool("execute_command", "Execute an Obsidian command by ID", ExecuteCommandSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", `/commands/${encodeURIComponent(p.commandId)}/`));
  });

  // Open
  server.tool("open_note", "Open a note in Obsidian", OpenNoteSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", `/open/${encodeURIComponent(p.path)}`, p.newLeaf !== undefined ? { newLeaf: p.newLeaf } : undefined));
  });

  // Periodic notes
  server.tool("get_periodic_note", "Get a periodic note (daily, weekly, monthly, quarterly, yearly)", GetPeriodicNoteSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/periodic/${p.period}/`, undefined, "application/vnd.olrapi.note+json"));
  });

  // Status
  server.tool("get_status", "Get Obsidian vault status and server info", GetStatusSchema.shape, async () => {
    return toolResult(await client.callApi("GET", "/"));
  });

  // Raw
  server.tool("raw_api_call", "Call any Obsidian Local REST API endpoint directly", RawApiCallSchema.shape, async (p) => {
    try {
      return toolResult(await client.callApi(p.method, p.path, p.body ?? undefined, p.accept));
    } catch (error) {
      if (error instanceof ObsidianError) return toolError(`Obsidian error ${error.status}: ${error.description}`);
      throw error;
    }
  });
}
