import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { N8nClient } from "../src/lib/client.js";
import { registerWorkflowTools } from "../src/tools/workflows.js";
import { registerResourceTools } from "../src/tools/resources.js";
function s() { return { c: new N8nClient({ apiKey: "k", baseUrl: "http://localhost" }), s: new McpServer({ name: "t", version: "1.0.0" }) }; }
describe("Registration", () => { it("ALL", () => { const x = s(); expect(() => { registerWorkflowTools(x.s, x.c); registerResourceTools(x.s, x.c); }).not.toThrow(); }); });
