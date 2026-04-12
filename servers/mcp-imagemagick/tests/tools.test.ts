import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ImageMagickRunner } from "../src/lib/runner.js";
import { registerBasicTools } from "../src/tools/basic.js";
import { registerEffectTools } from "../src/tools/effects.js";
import { registerAdvancedTools } from "../src/tools/advanced.js";

function setup() { return { runner: new ImageMagickRunner(), server: new McpServer({ name: "test", version: "1.0.0" }) }; }

describe("Tool registration", () => {
  it("basic", () => { const s = setup(); expect(() => registerBasicTools(s.server, s.runner)).not.toThrow(); });
  it("effects", () => { const s = setup(); expect(() => registerEffectTools(s.server, s.runner)).not.toThrow(); });
  it("advanced", () => { const s = setup(); expect(() => registerAdvancedTools(s.server, s.runner)).not.toThrow(); });
  it("ALL tools", () => { const s = setup(); expect(() => { registerBasicTools(s.server, s.runner); registerEffectTools(s.server, s.runner); registerAdvancedTools(s.server, s.runner); }).not.toThrow(); });
});
