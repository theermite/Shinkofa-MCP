import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OllamaClient, OllamaError } from "../src/lib/client.js";
import { registerModelTools } from "../src/tools/models.js";

let server: McpServer;
let client: OllamaClient;
let getSpy: ReturnType<typeof vi.spyOn>;
let postSpy: ReturnType<typeof vi.spyOn>;
let delSpy: ReturnType<typeof vi.spyOn>;
let headSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new OllamaClient();
  getSpy = vi.spyOn(client, "get").mockResolvedValue({});
  postSpy = vi.spyOn(client, "post").mockResolvedValue({});
  delSpy = vi.spyOn(client, "del").mockResolvedValue(undefined);
  headSpy = vi.spyOn(client, "head").mockResolvedValue({ exists: true, status: 200 });
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as (...a: unknown[]) => unknown);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerModelTools(server, client);
});

describe("Model tools — registration", () => {
  it("should_register_all_9_model_tools", () => {
    const expected = [
      "list_models",
      "show_model",
      "copy_model",
      "delete_model",
      "pull_model",
      "push_model",
      "create_model",
      "list_running_models",
      "check_blob",
    ];
    for (const name of expected) {
      expect(registeredTools.has(name)).toBe(true);
    }
  });
});

describe("Model tools — calls", () => {
  it("should_list_models", async () => {
    const cb = registeredTools.get("list_models")!;
    await cb({});
    expect(getSpy).toHaveBeenCalledWith("/api/tags");
  });

  it("should_show_model", async () => {
    const cb = registeredTools.get("show_model")!;
    await cb({ model: "llama3" });
    expect(postSpy).toHaveBeenCalledWith("/api/show", { model: "llama3" });
  });

  it("should_copy_model", async () => {
    const cb = registeredTools.get("copy_model")!;
    await cb({ source: "llama3", destination: "my-llama" });
    expect(postSpy).toHaveBeenCalledWith("/api/copy", {
      source: "llama3",
      destination: "my-llama",
    });
  });

  it("should_delete_model", async () => {
    const cb = registeredTools.get("delete_model")!;
    await cb({ model: "old" });
    expect(delSpy).toHaveBeenCalledWith("/api/delete", { model: "old" });
  });

  it("should_pull_model_with_stream_false", async () => {
    const cb = registeredTools.get("pull_model")!;
    await cb({ model: "llama3" });
    expect(postSpy).toHaveBeenCalledWith("/api/pull", {
      model: "llama3",
      stream: false,
    });
  });

  it("should_push_model_with_stream_false", async () => {
    const cb = registeredTools.get("push_model")!;
    await cb({ model: "my-model" });
    expect(postSpy).toHaveBeenCalledWith("/api/push", {
      model: "my-model",
      stream: false,
    });
  });

  it("should_create_model_with_stream_false", async () => {
    const cb = registeredTools.get("create_model")!;
    await cb({ model: "custom", modelfile: "FROM llama3" });
    expect(postSpy).toHaveBeenCalledWith("/api/create", {
      model: "custom",
      modelfile: "FROM llama3",
      stream: false,
    });
  });

  it("should_list_running_models", async () => {
    const cb = registeredTools.get("list_running_models")!;
    await cb({});
    expect(getSpy).toHaveBeenCalledWith("/api/ps");
  });

  it("should_check_blob", async () => {
    const cb = registeredTools.get("check_blob")!;
    await cb({ digest: "sha256:abc123" });
    expect(headSpy).toHaveBeenCalledWith("/api/blobs/sha256:abc123");
  });
});

describe("Model tools — error handling", () => {
  it("should_handle_OllamaError_on_show", async () => {
    postSpy.mockRejectedValue(new OllamaError(404, "model not found"));
    const cb = registeredTools.get("show_model")!;
    const result = (await cb({ model: "nope" })) as {
      isError: boolean;
      content: { text: string }[];
    };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("model not found");
  });
});
