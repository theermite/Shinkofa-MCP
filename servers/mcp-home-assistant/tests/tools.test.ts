import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HAClient } from "../src/lib/client.js";
import { registerEntityTools } from "../src/tools/entities.js";
import { registerInfoTools } from "../src/tools/info.js";
function s() { return { c: new HAClient({ accessToken: "t", baseUrl: "http://ha" }), s: new McpServer({ name: "t", version: "1.0.0" }) }; }
describe("Registration", () => { it("ALL", () => { const x = s(); expect(() => { registerEntityTools(x.s, x.c); registerInfoTools(x.s, x.c); }).not.toThrow(); }); });
