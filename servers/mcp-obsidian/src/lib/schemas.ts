import { z } from "zod";

// ── Vault / Files ──
export const GetNoteSchema = z.object({ path: z.string().describe("Note path relative to vault root (e.g. 'folder/note.md')") });
export const CreateNoteSchema = z.object({ path: z.string(), content: z.string().describe("Markdown content") });
export const UpdateNoteSchema = z.object({ path: z.string(), content: z.string() });
export const AppendNoteSchema = z.object({ path: z.string(), content: z.string().describe("Content to append") });
export const PrependNoteSchema = z.object({ path: z.string(), content: z.string().describe("Content to prepend") });
export const DeleteNoteSchema = z.object({ path: z.string() });
export const ListFilesSchema = z.object({ path: z.string().optional().describe("Directory path (default: vault root)") });
export const SearchSchema = z.object({ query: z.string().describe("Search query"), contextLength: z.number().optional().describe("Characters of context around matches") });
export const SearchJsonLogicSchema = z.object({ query: z.record(z.unknown()).describe("JsonLogic query object") });

// ── Active File ──
export const GetActiveFileSchema = z.object({});
export const UpdateActiveFileSchema = z.object({ content: z.string() });
export const AppendActiveFileSchema = z.object({ content: z.string() });

// ── Commands ──
export const ListCommandsSchema = z.object({});
export const ExecuteCommandSchema = z.object({ commandId: z.string().describe("Command ID (e.g. 'editor:toggle-bold')") });

// ── Open ──
export const OpenNoteSchema = z.object({ path: z.string(), newLeaf: z.boolean().optional() });

// ── Periodic Notes ──
export const GetPeriodicNoteSchema = z.object({ period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]) });

// ── Status ──
export const GetStatusSchema = z.object({});

// ── Raw ──
export const RawApiCallSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string().describe("API path (e.g. '/vault/my-note.md')"),
  body: z.union([z.string(), z.record(z.unknown())]).optional(),
  accept: z.string().optional().describe("Accept header (e.g. 'application/vnd.olrapi.note+json')"),
});
