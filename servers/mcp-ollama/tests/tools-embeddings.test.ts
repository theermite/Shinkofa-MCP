import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OllamaClient } from "../src/lib/client.js";
import { registerEmbeddingTools } from "../src/tools/embeddings.js";

let server: McpServer;
let client: OllamaClient;
let postSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new OllamaClient();
  postSpy = vi.spyOn(client, "post").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as (...a: unknown[]) => unknown);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerEmbeddingTools(server, client);
});

describe("Embedding tools", () => {
  it("should_register_embed_tool", () => {
    expect(registeredTools.has("embed")).toBe(true);
  });

  it("should_call_embed_with_string_input", async () => {
    const cb = registeredTools.get("embed")!;
    await cb({ model: "nomic-embed-text", input: "hello" });
    expect(postSpy).toHaveBeenCalledWith("/api/embed", {
      model: "nomic-embed-text",
      input: "hello",
    });
  });

  it("should_call_embed_with_array_input", async () => {
    const cb = registeredTools.get("embed")!;
    await cb({ model: "nomic-embed-text", input: ["a", "b"] });
    expect(postSpy).toHaveBeenCalledWith("/api/embed", {
      model: "nomic-embed-text",
      input: ["a", "b"],
    });
  });
});
