import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OllamaClient } from "../lib/client.js";
import {
  CheckBlobSchema,
  CopyModelSchema,
  CreateModelSchema,
  DeleteModelSchema,
  PullModelSchema,
  PushModelSchema,
  ShowModelSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerModelTools(server: McpServer, client: OllamaClient): void {
  server.tool("list_models", "List all locally available models", {}, async () =>
    withErrorHandler(async () => toolResult(await client.get("/api/tags"))),
  );

  server.tool(
    "show_model",
    "Show details of a model (parameters, template, license)",
    ShowModelSchema.shape,
    async (p) => withErrorHandler(async () => toolResult(await client.post("/api/show", p))),
  );

  server.tool("copy_model", "Copy/rename a model locally", CopyModelSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.post("/api/copy", p))),
  );

  server.tool("delete_model", "Delete a local model", DeleteModelSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.del("/api/delete", p))),
  );

  server.tool("pull_model", "Pull a model from the Ollama registry (non-streaming)", PullModelSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.post("/api/pull", { ...p, stream: false }))),
  );

  server.tool("push_model", "Push a model to the Ollama registry (non-streaming)", PushModelSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.post("/api/push", { ...p, stream: false }))),
  );

  server.tool("create_model", "Create a model from a Modelfile (non-streaming)", CreateModelSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.post("/api/create", { ...p, stream: false }))),
  );

  server.tool("list_running_models", "List currently loaded/running models with VRAM usage", {}, async () =>
    withErrorHandler(async () => toolResult(await client.get("/api/ps"))),
  );

  server.tool("check_blob", "Check if a blob exists on the server by digest", CheckBlobSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.head(`/api/blobs/${p.digest}`))),
  );
}
