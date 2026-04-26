import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import { N8nClient } from "../src/lib/client.js";
import { registerResourceTools } from "../src/tools/resources.js";
import { registerWorkflowTools } from "../src/tools/workflows.js";

function setup() {
  const client = new N8nClient({ apiKey: "test-key", baseUrl: "http://localhost:5678" });
  const server = new McpServer({ name: "test-n8n", version: "1.0.0" });
  return { client, server };
}

describe("Workflow tool registration", () => {
  it("should_register_10_workflow_tools_without_throwing", () => {
    const { server, client } = setup();
    expect(() => registerWorkflowTools(server, client)).not.toThrow();
  });

  it("should_register_all_expected_workflow_tool_names", () => {
    const { server, client } = setup();
    const registered: string[] = [];
    const origTool = server.tool.bind(server);
    server.tool = ((name: string, ...args: unknown[]) => {
      registered.push(name);
      return origTool(name, ...args);
    }) as typeof server.tool;
    registerWorkflowTools(server, client);
    expect(registered).toEqual([
      "list_workflows",
      "get_workflow",
      "create_workflow",
      "update_workflow",
      "delete_workflow",
      "activate_workflow",
      "deactivate_workflow",
      "run_workflow",
      "get_workflow_tags",
      "set_workflow_tags",
    ]);
    expect(registered).toHaveLength(10);
  });
});

describe("Resource tool registration", () => {
  it("should_register_18_resource_tools_without_throwing", () => {
    const { server, client } = setup();
    expect(() => registerResourceTools(server, client)).not.toThrow();
  });

  it("should_register_all_expected_resource_tool_names", () => {
    const { server, client } = setup();
    const registered: string[] = [];
    const origTool = server.tool.bind(server);
    server.tool = ((name: string, ...args: unknown[]) => {
      registered.push(name);
      return origTool(name, ...args);
    }) as typeof server.tool;
    registerResourceTools(server, client);
    expect(registered).toEqual([
      "list_executions",
      "get_execution",
      "delete_execution",
      "create_credential",
      "delete_credential",
      "get_credential_schema",
      "list_tags",
      "create_tag",
      "get_tag",
      "update_tag",
      "delete_tag",
      "list_variables",
      "create_variable",
      "delete_variable",
      "list_users",
      "get_me",
      "generate_audit",
      "raw_api_call",
    ]);
    expect(registered).toHaveLength(18);
  });
});

describe("Combined registration", () => {
  it("should_register_28_total_tools", () => {
    const { server, client } = setup();
    const registered: string[] = [];
    const origTool = server.tool.bind(server);
    server.tool = ((name: string, ...args: unknown[]) => {
      registered.push(name);
      return origTool(name, ...args);
    }) as typeof server.tool;
    registerWorkflowTools(server, client);
    registerResourceTools(server, client);
    expect(registered).toHaveLength(28);
  });
});
