import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OllamaClient, OllamaError } from "../src/lib/client.js";
import { registerGenerationTools } from "../src/tools/generation.js";

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

  registerGenerationTools(server, client);
});

describe("Generation tools", () => {
  it("should_register_generate_tool", () => {
    expect(registeredTools.has("generate")).toBe(true);
  });

  it("should_register_chat_tool", () => {
    expect(registeredTools.has("chat")).toBe(true);
  });

  it("should_call_generate_with_stream_false", async () => {
    const cb = registeredTools.get("generate")!;
    await cb({ model: "llama3", prompt: "hello" });
    expect(postSpy).toHaveBeenCalledWith("/api/generate", {
      model: "llama3",
      prompt: "hello",
      stream: false,
    });
  });

  it("should_call_chat_with_stream_false", async () => {
    const cb = registeredTools.get("chat")!;
    await cb({
      model: "llama3",
      messages: [{ role: "user", content: "hi" }],
    });
    expect(postSpy).toHaveBeenCalledWith("/api/chat", {
      model: "llama3",
      messages: [{ role: "user", content: "hi" }],
      stream: false,
    });
  });

  it("should_handle_OllamaError", async () => {
    postSpy.mockRejectedValue(new OllamaError(404, "model not found"));
    const cb = registeredTools.get("generate")!;
    const result = (await cb({ model: "nope", prompt: "hi" })) as {
      isError: boolean;
      content: { text: string }[];
    };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("404");
  });
});
