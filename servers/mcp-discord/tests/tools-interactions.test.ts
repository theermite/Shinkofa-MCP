import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiscordClient, DiscordError, DiscordRateLimitError } from "../src/lib/client.js";
import { registerInteractionTools } from "../src/tools/interactions.js";

let server: McpServer;
let client: DiscordClient;
let callApiSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: any[]) => any>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new DiscordClient({ botToken: "test_token" });
  callApiSpy = vi.spyOn(client, "callApi").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as any);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerInteractionTools(server, client);
});

describe("create_interaction_response", () => {
  it("should_call_POST_interaction_callback_with_type_and_data_when_responding", async () => {
    const handler = registeredTools.get("create_interaction_response")!;
    await handler({ interaction_id: "int1", interaction_token: "tok1", type: 4, data: { content: "Pong!" } });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/interactions/int1/tok1/callback", {
      type: 4,
      data: { content: "Pong!" },
    });
  });
});

describe("get_original_response", () => {
  it("should_call_GET_original_message_when_fetching", async () => {
    const handler = registeredTools.get("get_original_response")!;
    await handler({ application_id: "app1", interaction_token: "tok1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/webhooks/app1/tok1/messages/@original");
  });
});

describe("edit_original_response", () => {
  it("should_call_PATCH_original_message_with_body_when_editing", async () => {
    const handler = registeredTools.get("edit_original_response")!;
    await handler({ application_id: "app1", interaction_token: "tok1", content: "Updated" });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/webhooks/app1/tok1/messages/@original", { content: "Updated" });
  });
});

describe("delete_original_response", () => {
  it("should_call_DELETE_original_message_when_deleting", async () => {
    const handler = registeredTools.get("delete_original_response")!;
    await handler({ application_id: "app1", interaction_token: "tok1" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/webhooks/app1/tok1/messages/@original");
  });
});

describe("create_followup", () => {
  it("should_call_POST_webhook_with_body_when_sending_followup", async () => {
    const handler = registeredTools.get("create_followup")!;
    await handler({ application_id: "app1", interaction_token: "tok1", content: "Follow-up!" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/webhooks/app1/tok1", { content: "Follow-up!" });
  });
});

describe("error handling", () => {
  it("should_return_error_result_when_discord_api_error", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordError(404, 10062, "Unknown interaction"));
    const handler = registeredTools.get("create_interaction_response")!;
    const result = await handler({ interaction_id: "bad", interaction_token: "tok1", type: 4 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unknown interaction");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordRateLimitError(2, false));
    const handler = registeredTools.get("create_followup")!;
    const result = await handler({ application_id: "app1", interaction_token: "tok1", content: "test" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("rate limit");
  });

  it("should_return_timeout_error_when_request_aborted", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    callApiSpy.mockRejectedValueOnce(abortError);
    const handler = registeredTools.get("get_original_response")!;
    const result = await handler({ application_id: "app1", interaction_token: "tok1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("timed out");
  });
});
